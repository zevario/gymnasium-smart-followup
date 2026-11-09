import { PilotPasswordForm } from '../components/PilotPasswordForm.jsx';

import { PageIntro } from '../../../shared/components/PageIntro.jsx';

export function PilotProfile({ user }) {
  return (
    <>
      <PageIntro eyebrow="GYMNASYUM" title={user.name} subtitle={user.email + ' · ' + user.role} />
      <PilotPasswordForm />
    </>
  );
}
