import { requireChatGPTUser } from './chatgpt-auth';
import { SomusApp } from '@/components/somus-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await requireChatGPTUser('/');

  return (
    <SomusApp
      userName={user.fullName?.split(' ')[0] ?? user.email.split('@')[0]}
      userEmail={user.email}
    />
  );
}
