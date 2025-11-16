import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import "./Start.css";

function Start() {
  const navigate = useNavigate();

  return (
    <div className="start-container">
      <div className="overlay">
        <h1 className="title">EDUNOW</h1>
        <Button
          variant="primary"
          size="large"
          className="play-button"
          onClick={() => navigate("/home")}
        >
          PLAY
        </Button>
      </div>
    </div>
  );
}

export default Start;
