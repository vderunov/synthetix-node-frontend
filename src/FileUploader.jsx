import { CarWriter } from '@ipld/car/writer';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { useHelia } from './useHelia';
import { carWriterOutToBlob, downloadCarFile, readFileAsUint8Array } from './utils';

function FileUploader() {
  const { heliaCar, fs, error, starting } = useHelia();
  const [files, setFiles] = useState([]);
  const [carBlob, setCarBlob] = useState(null);
  const [rootCID, setRootCID] = useState(null);

  const handleFileEvent = useCallback((e) => {
    const filesToUpload = [...e.target.files];
    setFiles(filesToUpload);
  }, []);

  const carBlobFilerQuery = useQuery({
    enabled: fs !== null && heliaCar !== null && files.length > 0,
    queryKey: [
      'carBlobFilerQuery',
      files.map((file) => `${file.name}_${file.lastModified}`).join(','),
    ],
    queryFn: async () => {
      let rootCID = await fs.addDirectory();
      for await (const file of files) {
        const fileCid = await fs.addBytes(await readFileAsUint8Array(file));
        rootCID = await fs.cp(fileCid, rootCID, file.name);
      }

      const { writer, out } = await CarWriter.create(rootCID);
      const carBlob = carWriterOutToBlob(out);
      await heliaCar.export(rootCID, writer);

      return {
        carBlob: await carBlob,
        rootCID,
      };
    },
  });

  useEffect(() => {
    if (carBlobFilerQuery.data) {
      setCarBlob(carBlobFilerQuery.data.carBlob);
      setRootCID(carBlobFilerQuery.data.rootCID);
    } else {
      setCarBlob(null);
      setRootCID(null);
    }
  }, [carBlobFilerQuery.data]);

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
              <input className="file-input" type="file" multiple onChange={handleFileEvent} />
              <span className="file-cta">
                <span className="file-label">Select Files</span>
              </span>
            </label>
          </div>

          {files.length > 0 ? (
            <div className="list pb-4">
              {files.map(({ name }) => (
                <div key={name} className="list-item">
                  <div className="list-item-title">{name}</div>
                </div>
              ))}
            </div>
          ) : null}

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
                className={`button is-link ${carBlobFilerQuery.isPending ? 'is-loading' : ''}`}
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

export default FileUploader;
