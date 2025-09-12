import React from 'react';
import styled from 'styled-components';

const DryAgainButton = ({ onClick, disabled }) => {
  return (
    <StyledWrapper>
      <button className="button" onClick={onClick} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" width={16} viewBox="0 0 20 20" height={16} fill="none" className="svg-icon">
          <g strokeWidth="1.5" strokeLinecap="round" stroke="#ff342b">
            <path d="m3.33337 10.8333c0 3.6819 2.98477 6.6667 6.66663 6.6667 3.682 0 6.6667-2.9848 6.6667-6.6667 0-3.68188-2.9847-6.66664-6.6667-6.66664-1.29938 0-2.51191.37174-3.5371 1.01468" />
            <path d="m7.69867 1.58163-1.44987 3.28435c-.18587.42104.00478.91303.42582 1.0989l3.28438 1.44986" />
          </g>
        </svg>
        <span className="label">Dry Again</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    gap: 6px;
    height: 36px;
    min-width: 120px;
    border: none;
    background: #ff362b34;
    border-radius: 18px;
    cursor: pointer;
    font-size: 14px;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .label {
    line-height: 16px;
    font-size: 14px;
    color: #ff342b;
    font-weight: 600;
  }

  .button:hover:not(:disabled) {
    background: #ff362b52;
  }

  .button:hover:not(:disabled) .svg-icon {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(-360deg);
    }
  }`;

export default DryAgainButton;