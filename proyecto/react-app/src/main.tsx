import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Start from "./Start/Start";
import App from "./App";

function Root() {
  const [started, setStarted] = useState(false);

  return (
    <StrictMode>
      {!started ? <Start onPlay={() => setStarted(true)} /> : <App />}
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
