import { Brand } from "@/components/common";

const updated = "1 October 2026";

export default function LegalPage({ type }) {
  const privacy = type === "privacy";
  return (
    <main className="legal-page">
      <header className="legal-header">
        <a href="/" aria-label="JobTrack home"><Brand /></a>
        <a href="/">Back to JobTrack</a>
      </header>

      <article className="legal-card">
        <p className="eyebrow">JOBTRACK</p>
        <h1>{privacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p className="legal-updated">Last updated: {updated}</p>

        {privacy ? <Privacy /> : <Terms />}
      </article>
    </main>
  );
}

function Privacy() {
  return (
    <>
      <section>
        <h2>Overview</h2>
        <p>
          JobTrack is a personal job-application tracker. It helps users organise
          applications, stages, interviews, follow-ups and optional Gmail-derived
          job application updates.
        </p>
      </section>

      <section>
        <h2>Google account data</h2>
        <p>
          Google Sign-In uses OpenID, profile and email information to authenticate
          you and keep each workspace separate.
        </p>
        <p>
          Smart Inbox Sync is optional. It requests read-only Gmail access only
          after you choose Connect Gmail. JobTrack searches recent messages that
          may relate to applications and reads limited message information such as
          the message identifier, date, sender, subject and short snippet. JobTrack
          does not send email, delete email, modify email, mark email as read, or
          read attachments.
        </p>
      </section>

      <section>
        <h2>How Gmail data is used</h2>
        <p>
          Gmail data is used only to identify possible job-application events such
          as Applied, Screening, Interview, Offer or Rejected and to help update
          your private JobTrack workspace. Clear Applied or Screening updates may
          be applied automatically when JobTrack can confidently match them to an
          existing application. Uncertain matches are shown as Needs review.
        </p>
      </section>

      <section>
        <h2>Storage and retention</h2>
        <p>
          Gmail access tokens are kept in the server session and are not stored in
          the application database. JobTrack does not request a Gmail refresh
          token for Smart Inbox Sync.
        </p>
        <p>
          Pending Gmail suggestions can temporarily store the message identifier,
          sender, subject and short snippet so you can review them. After a
          suggestion is approved or dismissed, the stored sender, subject and
          snippet are cleared while the message identifier can be retained to
          prevent the same message from being suggested again. Disconnect & clear
          emails removes imported Gmail suggestion records for your account.
          Application records created or updated from an email remain part of your
          workspace until you delete them.
        </p>
      </section>

      <section>
        <h2>Other information</h2>
        <p>
          JobTrack stores information you enter into the service, including
          companies, roles, application stages, dates, notes, interviews and
          follow-ups. This information is associated with your authenticated
          Google account identifier so that it is shown only in your workspace.
        </p>
      </section>

      <section>
        <h2>Sharing and advertising</h2>
        <p>
          JobTrack does not sell Google user data and does not use Google user data
          for advertising. Data may be processed by infrastructure providers only
          as needed to host, secure and operate the service, or disclosed when
          required by law.
        </p>
      </section>

      <section>
        <h2>User controls and deletion</h2>
        <p>
          You can disconnect Gmail and clear imported email records from Smart
          Inbox Sync. Applications can be permanently removed from JobTrack.
          You can also revoke JobTrack's Google authorization from your Google
          Account connections page. To request deletion of remaining account or
          workspace data, contact the developer at{" "}
          <a href="mailto:km.sarth@gmail.com">km.sarth@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Google API Services User Data Policy</h2>
        <p>
          JobTrack's use and transfer of information received from Google APIs
          adheres to the Google API Services User Data Policy, including the
          Limited Use requirements. Google user data is used only to provide and
          improve the user-facing features described in this policy.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          JobTrack uses HTTPS in production, server-side authentication sessions,
          OAuth state and PKCE for Gmail connection, access controls tied to the
          signed-in account, and CSRF protection for authenticated writes.
          No internet service can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          This policy may be updated when JobTrack's features or data practices
          change. The current version will be published on this page. Questions
          about privacy or Google data use can be sent to{" "}
          <a href="mailto:km.sarth@gmail.com">km.sarth@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function Terms() {
  return (
    <>
      <section>
        <h2>Using JobTrack</h2>
        <p>
          JobTrack is provided as a personal job-search organisation tool. You are
          responsible for the accuracy of information you enter or approve and for
          reviewing automatically detected application updates.
        </p>
      </section>

      <section>
        <h2>Google services</h2>
        <p>
          Google Sign-In is used for authentication. Smart Inbox Sync is optional
          and requires separate Gmail read-only authorization. Your use of Google
          services is also subject to Google's applicable terms and policies. You
          may revoke JobTrack's access at any time.
        </p>
      </section>

      <section>
        <h2>No employment or outcome guarantee</h2>
        <p>
          JobTrack organises information but does not submit applications on your
          behalf, make hiring decisions, or guarantee interviews, offers or other
          employment outcomes.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not use JobTrack to violate law, access another person's data without
          permission, interfere with the service, or attempt to bypass security
          controls.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          JobTrack may change, suspend or discontinue features. The service is
          provided without a guarantee of uninterrupted availability. Important
          job-search information should not rely on JobTrack as its only copy.
        </p>
      </section>

      <section>
        <h2>Your data</h2>
        <p>
          You retain responsibility for the content you place in your workspace.
          Privacy and Google-data practices are described in the{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:km.sarth@gmail.com">km.sarth@gmail.com</a>.
        </p>
      </section>
    </>
  );
}
