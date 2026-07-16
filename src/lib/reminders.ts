import type { Reminder } from "@/types";

/**
 * A reminder is overdue when it is still actionable and its due date has passed.
 * Derived at read time because no code path ever writes the "overdue" status,
 * so relying on the stored status alone made overdue reminders invisible.
 */
export function isOverdue(reminder: Reminder, today: string): boolean {
  if (reminder.status === "overdue") return true;
  return (
    (reminder.status === "todo" || reminder.status === "postponed") &&
    reminder.dueDate !== "" &&
    reminder.dueDate < today
  );
}

export function countOverdue(reminders: Reminder[], today: string): number {
  return reminders.reduce((total, reminder) => total + (isOverdue(reminder, today) ? 1 : 0), 0);
}
