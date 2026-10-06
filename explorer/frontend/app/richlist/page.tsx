import { redirect } from 'next/navigation';

export default function RichListRedirect() {
  // If anyone tries to access the old explorer richlist directly, redirect them to the real one
  redirect('https://tarcoin.org/richlist');
}
