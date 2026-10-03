export function getStudentDisplayName(student, fallback = "your child") {
  return (
    student?.preferredName?.trim() ||
    student?.firstName?.trim() ||
    fallback
  );
}
