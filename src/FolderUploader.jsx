import { CarWriter } from '@ipld/car/writer';
import React, { useCallback, useEffect, useState } from 'react';
import { useHelia } from './useHelia';
import { carWriterOutToBlob, downloadCarFile, readFileAsUint8Array } from './utils';

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
      const inputFiles = await Promise.all(
        files.map(async (file) => ({
          path: file.webkitRelativePath || file.name,
          content: await readFileAsUint8Array(file),
        }))
      );

      let rootCID;
      for await (const entry of fs.addAll(inputFiles)) {
        rootCID = entry.cid;
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

  const handleDownload = useCallback(() => {
    downloadCarFile(carBlob);
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
                onClick={handleDownload}
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
