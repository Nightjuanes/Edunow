import { useNavigate } from "react-router-dom";
import "./Start.css";

function Start() {
  const navigate = useNavigate();

  return (
    <div className="start-container">
      <div className="overlay">
        <h1 className="title">EDUNOW</h1>
        <button className="play-button" onClick={() => navigate("/home")}>
          PLAY
        </button>
      </div>
    </div>
  );
}

export default Start;
