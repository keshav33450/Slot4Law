import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./home";
import Login from "./login";
import SignUp from "./signup";
import FindLawyer from "./findlawyer";
import BookConsultation from "./bookconsultation";
import AskQuestion from "./askquestion";
import LegalAdvice from "./LegalAdvice";
import AboutUs from "./aboutus";
import PrivateRoute from "./privateroute";
import LegalForum from "./LegalForum";
import PreviouslyAskedQuestions from "./PreviouslyAskedQuestions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/find-lawyer"
          element={
            <PrivateRoute>
              <FindLawyer />
            </PrivateRoute>
          }
        />

        <Route
          path="/book-consultation"
          element={
            <PrivateRoute>
              <BookConsultation />
            </PrivateRoute>
          }
        />

        <Route
          path="/ask-question"
          element={
            <PrivateRoute>
              <AskQuestion />
            </PrivateRoute>
          }
        />

        <Route path="/legal-advice" element={<LegalAdvice />} />

        <Route
          path="/about-us"
          element={
            <PrivateRoute>
              <AboutUs />
            </PrivateRoute>
          }
        />

        <Route path="/legal-forum" element={<LegalForum />} />

        {/* ✅ My Questions */}
        <Route
          path="/previous-questions"
          element={
            <PrivateRoute>
              <PreviouslyAskedQuestions />
            </PrivateRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
