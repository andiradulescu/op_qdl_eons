export class structHelper_io {
  data;
  direction;

  constructor(data, pos=0) {
    this.pos = pos
    this.data = data;
  }

  dword(littleEndian=true) {
    let view = new DataView(this.data.slice(this.pos, this.pos+4).buffer, 0);
    this.pos += 4;
    return view.getUint32(0, littleEndian);
  }

  qword(littleEndian=true) {
    let view = new DataView(this.data.slice(this.pos, this.pos+8).buffer, 0);
    this.pos += 8;
    return view.getBigUint64(0, littleEndian);
  }
}

export function packGenerator(elements, littleEndian=true) {
  let n = elements.length;
  const buffer = new ArrayBuffer(n*4);
  const view = new DataView(buffer);
  for (let i = 0; i < n; i++){
    view.setUint32(i*4, elements[i], littleEndian);
  }
  return new Uint8Array(view.buffer);
}

export function concatUint8Array(arrays){
  let length = 0;
  arrays.forEach(item => {
    if (item !== null)
      length += item.length;
  });

  let concatArray = new Uint8Array(length);
  let offset = 0;
  arrays.forEach( item => {
    if (item !== null) {
      concatArray.set(item, offset);
      offset += item.length;
    }
  });

  return concatArray;
}

export function containsBytes(subString, array) {
  let tArray = new TextDecoder().decode(array);
  return tArray.includes(subString);
}

export function compareStringToBytes(compareString, array) {
  let tArray = new TextDecoder().decode(array);
  return compareString == tArray;
}

const openFileOrFiles = async (multiple = false) => {
  // Feature detection. The API needs to be supported
  // and the app not run in an iframe.
  const supportsFileSystemAccess =
    "showOpenFilePicker" in window &&
    (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();
  // If the File System Access API is supported…
  if (supportsFileSystemAccess) {
    let fileOrFiles = undefined;
    try {
      // Show the file picker, optionally allowing multiple files.
      const handles = await showOpenFilePicker({ multiple });
      // Only one file is requested.
      if (!multiple) {
        // Add the `FileSystemFileHandle` as `.handle`.
        fileOrFiles = await handles[0].getFile();
        fileOrFiles.handle = handles[0];
      } else {
        fileOrFiles = await Promise.all(
          handles.map(async (handle) => {
            const file = await handle.getFile();
            // Add the `FileSystemFileHandle` as `.handle`.
            file.handle = handle;
            return file;
          })
        );
      }
    } catch (err) {
      // Fail silently if the user has simply canceled the dialog.
      if (err.name !== 'AbortError') {
        console.error(err.name, err.message);
      }
    }
    return fileOrFiles;
  }
  // Fallback if the File System Access API is not supported.
  return new Promise((resolve) => {
    // Append a new `<input type="file" multiple? />` and hide it.
    const input = document.createElement('input');
    input.style.display = 'none';
    input.type = 'file';
    document.body.append(input);
    if (multiple) {
      input.multiple = true;
    }
    // The `change` event fires when the user interacts with the dialog.
    input.addEventListener('change', () => {
      // Remove the `<input type="file" multiple? />` again from the DOM.
      input.remove();
      // If no files were selected, return.
      if (!input.files) {
        return;
      }
      // Return all files or just one file.
      resolve(multiple ? Array.from(input.files) : input.files[0]);
    });
    // Show the picker.
    if ('showPicker' in HTMLInputElement.prototype) {
      input.showPicker();
    } else {
      input.click();
    }
  });
};

export async function loadFileFromLocal() {
  const blob = await openFileOrFiles();
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(blob);
  });
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
