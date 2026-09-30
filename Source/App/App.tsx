import { GalleryPage } from "@/Dev/ComponentGallery/GalleryPage";

export function App() {
  const hash = window.location.hash.substring(1); // Remove leading '#'
  
  if (hash === "Gallery") {
    return <GalleryPage />;
  }
  
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Unorthodox Party Game</h1>
      <p>Navigate to <code>#/Gallery</code> to see the component gallery</p>
    </div>
  );
}