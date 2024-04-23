import React from 'react';

function WalletsList({ title, data, isFetching, isError }) {
  if (isFetching) {
    return <div className="skeleton-block" />;
  }

  if (isError) {
    return <p className="has-text-danger">Error fetching wallets</p>;
  }

  return (
    <div className="content">
      <h4 className="title is-4">{title}:</h4>
      <ol>
        {data?.length > 0 ? (
          data.map(({ id }) => (
            <li key={id}>
              <div className="truncate">{id}</div>
            </li>
          ))
        ) : (
          <h2 className="subtitle">No wallets</h2>
        )}
      </ol>
    </div>
  );
}

export default WalletsList;
