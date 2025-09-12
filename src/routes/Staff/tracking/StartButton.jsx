import React from 'react';
import styled from 'styled-components';

const StartButton = ({ onClick, disabled }) => {
  return (
    <StyledWrapper>
      <button onClick={onClick} disabled={disabled}>
        Start
        <div className="star-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 784.11 815.53">
            <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
          </svg>
        </div>
        <div className="star-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 784.11 815.53">
            <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
          </svg>
        </div>
        <div className="star-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 784.11 815.53">
            <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
          </svg>
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    position: relative;
    padding: 8px 16px;
    background: #fec195;
    font-size: 14px;
    font-weight: 500;
    color: #181818;
    border: 2px solid #fec195;
    border-radius: 6px;
    box-shadow: 0 0 0 #fec1958c;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    min-width: 70px;
    height: 36px;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .star-1 {
    position: absolute;
    top: 20%;
    left: 20%;
    width: 12px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
  }

  .star-2 {
    position: absolute;
    top: 45%;
    left: 45%;
    width: 8px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-3 {
    position: absolute;
    top: 40%;
    left: 40%;
    width: 4px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  button:hover:not(:disabled) {
    background: transparent;
    color: #fec195;
    box-shadow: 0 0 15px #fec1958c;
  }

  button:hover:not(:disabled) .star-1 {
    position: absolute;
    top: -60%;
    left: -20%;
    width: 12px;
    height: auto;
    filter: drop-shadow(0 0 8px #fffdef);
    z-index: 2;
  }

  button:hover:not(:disabled) .star-2 {
    position: absolute;
    top: -15%;
    left: 10%;
    width: 8px;
    height: auto;
    filter: drop-shadow(0 0 8px #fffdef);
    z-index: 2;
  }

  button:hover:not(:disabled) .star-3 {
    position: absolute;
    top: 45%;
    left: 25%;
    width: 4px;
    height: auto;
    filter: drop-shadow(0 0 8px #fffdef);
    z-index: 2;
  }

  .fil0 {
    fill: #fffdef;
  }`;

export default StartButton;