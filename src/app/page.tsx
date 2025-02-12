import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ClientUploadForm from './components/client_upload_form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // サーバー側の Supabase クライアント（クッキーの読み取りのみ）
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <div>
      <ClientUploadForm />
    </div>
  );
}