import { CarWriter } from '@ipld/car/writer';
import React, { useCallback, useEffect, useState } from 'react';
import { useHelia } from './useHelia';

async function readFileAsUint8Array(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer != null) {
        if (typeof arrayBuffer === 'string') {
          const uint8Array = new TextEncoder().encode(arrayBuffer);
          resolve(uint8Array);
        } else if (arrayBuffer instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        }
        return;
      }
      reject(new Error('arrayBuffer is null'));
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

async function carWriterOutToBlob(carReaderIterable) {
  const parts = [];
  for await (const part of carReaderIterable) {
    parts.push(part);
  }
  return new Blob(parts, { type: 'application/car' });
}

function FolderUploader() {
  const { heliaCar, fs, error, starting } = useHelia();
  const [files, setFiles] = useState([]);
  const [carBlob, setCarBlob] = useState(null);
  const [rootCID, setRootCID] = useState(null);

  const handleFileEvent = useCallback((e) => {
    const filesToUpload = [...e.target.files];

    setFiles(filesToUpload);
  }, []);

  useEffect(() => {
    if (fs == null || heliaCar == null || files.length === 0) {
      return;
    }

    const asyncFn = async () => {
      let rootCID = await fs.addDirectory();
      for await (const file of files) {
        const fileCid = await fs.addBytes(await readFileAsUint8Array(file));
        rootCID = await fs.cp(fileCid, rootCID, file.name);
      }

      const { writer, out } = await CarWriter.create(rootCID);
      const carBlob = carWriterOutToBlob(out);
      await heliaCar.export(rootCID, writer);
      setCarBlob(await carBlob);
      setRootCID(rootCID);
    };

    asyncFn();

    return () => {
      setCarBlob(null);
      setRootCID(null);
    };
  }, [files, fs, heliaCar]);

  const downloadCarFile = useCallback(async () => {
    if (carBlob == null) {
      return;
    }
    const downloadEl = document.createElement('a');
    const blobUrl = window.URL.createObjectURL(carBlob);
    downloadEl.href = blobUrl;
    downloadEl.download = 'directory.car';
    document.body.appendChild(downloadEl);
    downloadEl.click();
    window.URL.revokeObjectURL(blobUrl);
  }, [carBlob]);

  let statusColor = 'is-success';
  if (error) {
    statusColor = 'is-danger';
  } else if (starting) {
    statusColor = 'is-warning';
  }

  return (
    <section className="section">
      <div className="container">
        <span className={`tag ${statusColor}`}>Helia Status</span>
        <div className="box">
          <div className="file has-name">
            <label className="file-label">
              <input
                className="file-input"
                type="file"
                webkitdirectory="true"
                multiple
                onChange={handleFileEvent}
              />
              <span className="file-cta">
                <span className="file-label">Choose a folder…</span>
              </span>
            </label>
          </div>

          {rootCID == null || files.length === 0 ? null : (
            <>
              <div className="field">
                <label className="label">Car file CID:</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Example: bafybeideb6ss..."
                  value={rootCID.toString()}
                  readOnly
                />
              </div>
              <button
                type="button"
                className="button is-link"
                disabled={!carBlob}
                onClick={downloadCarFile}
              >
                Download Car file
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default FolderUploader;
