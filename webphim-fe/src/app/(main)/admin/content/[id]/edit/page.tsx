'use client';

import { useParams } from 'next/navigation';
import ContentForm from '@/components/admin/ContentForm';

export default function EditContentPage() {
  const params = useParams();
  const id = params.id as string;

  return <ContentForm mode="edit" contentId={id} key={id} />;
}
