import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil | Taberna Quimera',
  description: 'Gestión de cuenta y pedidos de cliente en Taberna Quimera.',
};

export const revalidate = 0; // Fresh user data

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      orders: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        ordersCount: user.orders.length,
      }}
    />
  );
}
