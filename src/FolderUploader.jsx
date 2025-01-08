import { CarWriter } from '@ipld/car/writer';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { useHelia } from './useHelia';
import { carWriterOutToBlob, downloadCarFile, readFileAsUint8Array } from './utils';

function FolderUploader() {
  const { heliaCar, fs, error, starting } = useHelia();
  const [files, setFiles] = useState([]);
  const [carBlob, setCarBlob] = useState(null);
  const [rootCID, setRootCID] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);

  const handleFileEvent = useCallback((e) => {
    const filesToUpload = [...e.target.files];
    setFiles(filesToUpload);
  }, []);

  const kuboIpfsAddMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('file', data);
      const response = await fetch('http://127.0.0.1:5001/api/v0/add', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Error uploading to IPFS');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResponse(data);
    },
  });

  const carBlobFolderQuery = useQuery({
    enabled: fs !== null && heliaCar !== null && files.length > 0,
    queryKey: [
      'carBlobFolderQuery',
      files.map((file) => `${file.name}_${file.lastModified}`).join(','),
    ],
    queryFn: async () => {
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

      return {
        carBlob: await carBlob,
        rootCID,
      };
    },
  });

  useEffect(() => {
    if (carBlobFolderQuery.data) {
      setCarBlob(carBlobFolderQuery.data.carBlob);
      setRootCID(carBlobFolderQuery.data.rootCID);
    } else {
      setCarBlob(null);
      setRootCID(null);
      setUploadResponse(null);
    }
  }, [carBlobFolderQuery.data]);

  const handleDownload = useCallback(() => {
    downloadCarFile(carBlob);
  }, [carBlob]);

  const handleUploadToIPFS = useCallback(() => {
    if (carBlob) {
      kuboIpfsAddMutation.mutate(carBlob);
    }
  }, [carBlob, kuboIpfsAddMutation]);

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
              <div className="buttons">
                <button
                  type="button"
                  className={`button is-link ${carBlobFolderQuery.isPending ? 'is-loading' : ''}`}
                  disabled={!carBlob}
                  onClick={handleDownload}
                >
                  Download Car file
                </button>
                <button
                  type="button"
                  className={`button is-link ${kuboIpfsAddMutation.isPending ? 'is-loading' : ''}`}
                  disabled={!carBlob || kuboIpfsAddMutation.isPending}
                  onClick={handleUploadToIPFS}
                >
                  Add directory to IPFS
                </button>
              </div>
              {uploadResponse ? (
                <pre className="mt-4">{JSON.stringify(uploadResponse, null, 2)}</pre>
              ) : null}
              {kuboIpfsAddMutation.isError ? (
                <p className="has-text-danger">{kuboIpfsAddMutation.error?.message}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default FolderUploader;