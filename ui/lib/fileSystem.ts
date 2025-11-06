/**
 * File System Access API helpers
 * Uses browser's File System Access API for reading/writing files
 */

export async function saveToFile(
  content: string,
  suggestedName: string,
  mimeType: string
): Promise<void> {
  try {
    // @ts-ignore - File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'JSON Files',
          accept: { [mimeType]: ['.json'] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('User cancelled file save');
      throw new Error('File save cancelled');
    }
    throw error;
  }
}

export async function loadFromFile(extension: string): Promise<string> {
  try {
    // @ts-ignore - File System Access API
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': [extension] },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    return await file.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('User cancelled file selection');
      throw new Error('File selection cancelled');
    }
    throw error;
  }
}
