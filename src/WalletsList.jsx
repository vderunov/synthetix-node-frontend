import React from 'react';

function WalletsList({ title, data, isFetching, isError }) {
  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching wallets</div>;
  }

  return (
    <div className="medium-padding">
      <h6 className="s12 m12 s12 center-align">{title}:</h6>
      <ol>
        {data.length > 0 ? data.map(({ id }) => <li key={id}>{id}</li>) : <div>No wallets</div>}
      </ol>
    </div>
  );
}

export default WalletsList;
