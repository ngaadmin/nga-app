import { TeacherStudentPage } from "@/components/privacy/teacher-student-page";

export const dynamic = "force-dynamic";

export default async function StudentDataPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <TeacherStudentPage username={decodeURIComponent(username)} />;
}
