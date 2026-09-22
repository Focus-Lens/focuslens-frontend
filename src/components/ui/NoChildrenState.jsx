import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "../../css/components/NoChildrenState.css";

export default function NoChildrenState() {
  return (
    <main className="no-children-state">
      <section className="no-children-card">
        <div className="no-children-mascot">
          <img src={logo} alt="FocusLens" />
        </div>
        <p className="no-children-description">
          You haven’t added a child yet. Create their study profile and send a private invitation, or connect with a child who already uses FocusLens.
        </p>
        <Link to="/choose-start" className="no-children-button">Add your child</Link>
        <p className="no-children-hint">Your child chooses what to share. Study reports appear only after you connect.</p>
      </section>
    </main>
  );
}
