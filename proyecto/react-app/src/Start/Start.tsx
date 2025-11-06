import "./Start.css";

interface StartProps {
  onPlay: () => void;
}

function Start({ onPlay }: StartProps) {
  return (
    <div className="start-container">
      <div className="overlay">
        <h1 className="title">EDUNOW</h1>
        <button className="play-button" onClick={onPlay}>
          PLAY
        </button>
      </div>
    </div>
  );
}

export default Start;
