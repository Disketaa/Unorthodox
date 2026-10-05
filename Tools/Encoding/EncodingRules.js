/** Encoding rule: text that was decoded twice. Mojibake is silent \u2014 a file full of it still
 * compiles, still lints and still renders \u2014 so the only place to catch it is a rule that
 * looks for the signature. Local plugin for the same reason as the comment one: the check is
 * three characters long, and the wording of the message is the point. The signatures live in
 * Mojibake.mjs, shared with the CSS audit. */

import { findMojibake } from "./Mojibake.mjs";

const MESSAGE =
  "Encoding is UTF-8. This text was decoded twice and has to be written again from the original.";

export const encodingPlugin = {
  rules: {
    "no-mojibake": {
      meta: {
        type: "problem",
        fixable: null,
        docs: {
          description: "Disallow text that was decoded twice, such as an em dash read as CP1251.",
        },
        messages: { mojibake: MESSAGE },
        schema: [],
      },
      create(context) {
        const source = context.sourceCode ?? context.getSourceCode();
        return {
          Program() {
            const match = findMojibake(source.getText());
            if (match === null) return;
            context.report({ loc: source.getLocFromIndex(match.index), messageId: "mojibake" });
          },
        };
      },
    },
  },
};
