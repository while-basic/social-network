export async function downloadImage(imageUrl: string, filename: string) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export function generateFilename(prompt: string, extension = 'jpg') {
  // Clean the prompt to create a valid filename
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  const timestamp = new Date().getTime();
  return `${cleanPrompt}-${timestamp}.${extension}`;
} 