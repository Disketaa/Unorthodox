[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command = 'h',

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Rest
)

# `uq` — one entry point for the checks this repo runs, so the fast path is the short one.
#
# Everything resolves to npm scripts or npx, so nothing here becomes a second source of truth:
# the alias is a keyboard shortcut, not a toolchain. The three things it adds over `npm run`:
#
#   * it runs from anywhere (the project root is derived from this script's own path)
#   * lint and typecheck take a path, so a change costs one file instead of the tree
#   * the default test run is the tests RELATED to what is uncommitted, not all 936

# The project root is two levels up: Tools\Cli\ sits inside the repo, and every command runs
# from the root so npm scripts and relative paths mean the same thing from any directory.
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# Runs a command at the project root and keeps its exit code. It does not exit: exiting from
# inside this function would end the script and silently drop a second pass in Invoke-RelatedTests.
# The worst code any pass returned is what the script exits with.
$script:uqExit = 0

function Invoke-Uq {
    param([string]$Exe, [string[]]$Arguments, [string]$Label)
    Write-Host "> $Label" -ForegroundColor DarkGray
    Push-Location $projectRoot
    try {
        & $Exe @Arguments
        $code = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($code -ne 0) { $script:uqExit = $code }
}

# Files with uncommitted work, in the shape vitest's `related` filter wants. `-uall` matters:
# without it an untracked folder arrives as one `?? Tests/` line, and a directory matches no
# test. Deletions are skipped because there is nothing left for vitest to relate them to. CSS
# is included because the layout suites read the stylesheets as files, so a token change really
# does have tests behind it.
function Get-ChangedFiles {
    $lines = & git -C $projectRoot status --porcelain -uall
    if ($LASTEXITCODE -ne 0) { return @() }
    $found = @()
    foreach ($line in $lines) {
        if ($line.Length -lt 4) { continue }
        if ($line.Substring(0, 2) -match 'D') { continue }
        $raw = ($line.Substring(3) -replace ' ->.*$', '').Trim('"')
        if ($raw -notmatch '\.(ts|tsx|css)$') { continue }
        if ($raw -match '\.d\.mts$') { continue }
        $full = Join-Path $projectRoot $raw
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
        $found += ($raw -replace '\\', '/')
    }
    return $found
}

# Run the tests that can see the given paths, in two passes.
#
# Pass one is `vitest related`, which walks the import graph. That is the cheap and correct answer
# for a changed .ts/.tsx. Pass two exists because the layout suites read stylesheets with `node:fs`
# instead of importing them, so a token change is invisible to the import graph and `related` alone
# reports no tests for it. Those suites live in Tests/ and are eight files, so naming the folder is
# enough and stays honest about what was skipped.
function Invoke-RelatedTests {
    param([string[]]$Paths)

    # Wrapped in @() so `.Count` is 0 rather than $null when the filter drops everything.
    $code = @($Paths | Where-Object { $_ -notmatch '\.css$' })
    $css = @($Paths | Where-Object { $_ -match '\.css$' })

    if ($code.Count -gt 0) {
        Invoke-Uq 'npx' (@('vitest', 'related', '--run') + $code) "vitest related ($($code.Count) module(s))"
    }
    if ($css.Count -gt 0) {
        Write-Host 'Stylesheet in the change, so the Tests/ suites that read it with node:fs run too.' -ForegroundColor DarkYellow
        Invoke-Uq 'npx' @('vitest', 'run', 'Tests') 'vitest run Tests'
    }
}

function Write-UqHelp {
    Write-Host 'uq: lint, typecheck, test and check' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  uq lint [paths...]   ESLint. No paths = whole repo.' -ForegroundColor Gray
    Write-Host '  uq fix  [paths...]   ESLint --fix.' -ForegroundColor Gray
    Write-Host '  uq tc                tsc over Source, Tools and Tests.' -ForegroundColor Gray
    Write-Host '  uq tc <path>         tsc for the scope that path belongs to.' -ForegroundColor Gray
    Write-Host '  uq t [filter]        Tests related to uncommitted changes, or all.' -ForegroundColor Gray
    Write-Host '  uq rel <paths...>    Tests related to those files.' -ForegroundColor Gray
    Write-Host '  uq ta [filter]       All tests. This is the 936-test run.' -ForegroundColor Gray
    Write-Host '  uq cm [args]         Comment audit.' -ForegroundColor Gray
    Write-Host '  uq cf                Rewrite comments to the canonical shape.' -ForegroundColor Gray
    Write-Host '  uq check             Everything: lint, typecheck, audit, tests, build.' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  Examples:' -ForegroundColor DarkGray
    Write-Host '    uq lint Source/Game/Reducer.ts' -ForegroundColor DarkGray
    Write-Host '    uq fix Source/Design/Components/Button' -ForegroundColor DarkGray
    Write-Host '    uq tc Tools' -ForegroundColor DarkGray
    Write-Host '    uq t RoundMarks' -ForegroundColor DarkGray
    Write-Host '    uq rel Source/Design/Tokens/Tokens.css' -ForegroundColor DarkGray
    Write-Host '    uq check' -ForegroundColor DarkGray
}

switch ($Command) {
    'h' { Write-UqHelp; exit 0 }
    'help' { Write-UqHelp; exit 0 }

    'lint' {
        if ($Rest -and $Rest.Count -gt 0) {
            Invoke-Uq 'npx' (@('eslint') + $Rest) "eslint $($Rest -join ' ')"
        }
        else {
            Invoke-Uq 'npx' @('eslint', '.') 'eslint .'
        }
    }

    'fix' {
        if ($Rest -and $Rest.Count -gt 0) {
            Invoke-Uq 'npx' (@('eslint', '--fix') + $Rest) "eslint --fix $($Rest -join ' ')"
        }
        else {
            Invoke-Uq 'npx' @('eslint', '--fix', '.') 'eslint --fix .'
        }
    }

    'tc' {
        if ($Rest -and $Rest.Count -gt 0) {
            $target = ($Rest | Select-Object -First 1) -replace '\\', '/'
            if ($target -like '*Tools*') {
                Invoke-Uq 'npx' @('tsc', '-p', 'Tools/tsconfig.json') 'tsc Tools'
            }
            if ($target -like '*Tests*') {
                Invoke-Uq 'npx' @('tsc', '-p', 'Tests/tsconfig.json') 'tsc Tests'
            }
            Invoke-Uq 'npx' @('tsc', '--noEmit') 'tsc --noEmit (Source)'
        }
        else {
            Invoke-Uq 'npm' @('run', 'typecheck') 'typecheck'
        }
    }

    't' {
        if ($Rest -and $Rest.Count -gt 0) {
            Invoke-Uq 'npx' (@('vitest', 'run') + $Rest) "vitest run $($Rest -join ' ')"
        }
        $changed = Get-ChangedFiles
        if ($changed.Count -eq 0) {
            Write-Host 'Nothing uncommitted. Running the whole suite.' -ForegroundColor DarkYellow
            Invoke-Uq 'npx' @('vitest', 'run') 'vitest run'
            return
        }
        Write-Host "Tests related to $($changed.Count) changed file(s)." -ForegroundColor DarkYellow
        Invoke-RelatedTests $changed
    }

    'rel' {
        if (-not $Rest -or $Rest.Count -eq 0) {
            Write-Host 'uq rel needs at least one file.' -ForegroundColor Yellow
            exit 1
        }
        Invoke-RelatedTests $Rest
    }

    'ta' {
        if ($Rest -and $Rest.Count -gt 0) {
            Invoke-Uq 'npx' (@('vitest', 'run') + $Rest) "vitest run $($Rest -join ' ')"
        }
        else {
            Invoke-Uq 'npx' @('vitest', 'run') 'vitest run'
        }
    }

    'cm' {
        if ($Rest -and $Rest.Count -gt 0) {
            Invoke-Uq 'npm' (@('run', 'comments') + $Rest) 'comments'
        }
        else {
            Invoke-Uq 'npm' @('run', 'comments') 'comments'
        }
    }

    'cf' { Invoke-Uq 'npm' @('run', 'comments:format') 'comments:format' }

    'check' { Invoke-Uq 'npm' @('run', 'check') 'npm run check' }

    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-UqHelp
        exit 1
    }
}

exit $script:uqExit
