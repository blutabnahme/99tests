import { redirect } from 'next/navigation';

export default function BookingRedirect({ params }: { params: { token: string } }) {
  redirect(`/patient/${params.token}`);
}
