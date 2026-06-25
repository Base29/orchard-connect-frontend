/**
 * Client-side helper to resize and crop an image to exactly 1080x1350 pixels (4:5 aspect ratio)
 * using an HTML5 Canvas cover crop strategy.
 */
export function resizeImageTo1080x1350(file: File): Promise<File> {
  return new Promise((resolve) => {
    // If the file is not an image, resolve with original file immediately
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1080;
          canvas.height = 1350;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.warn("Canvas 2D context not available. Falling back to original image.");
            resolve(file);
            return;
          }

          const imgRatio = img.width / img.height;
          const targetRatio = 1080 / 1350; // 0.8

          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgRatio > targetRatio) {
            // Image is wider than target aspect ratio (landscape/square-ish)
            drawHeight = img.height;
            drawWidth = img.height * targetRatio;
            offsetX = (img.width - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller than target aspect ratio (tall portrait)
            drawWidth = img.width;
            drawHeight = img.width / targetRatio;
            offsetX = 0;
            offsetY = (img.height - drawHeight) / 2;
          }

          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight, // Source sub-rect
            0,
            0,
            1080,
            1350 // Destination canvas rect
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Keep the original filename but change type to jpeg
                const originalName = file.name;
                const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                const newName = `${baseName}.jpg`;

                const resizedFile = new File([blob], newName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                console.warn("Canvas toBlob failed. Falling back to original image.");
                resolve(file);
              }
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          console.error("Failed to crop/resize image via canvas:", err);
          resolve(file);
        }
      };
      img.onerror = (err) => {
        console.error("Image loading failed:", err);
        resolve(file);
      };
    };
    reader.onerror = (err) => {
      console.error("FileReader failed:", err);
      resolve(file);
    };
  });
}
