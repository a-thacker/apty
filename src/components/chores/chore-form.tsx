"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createChore, updateChore } from "@/app/chores/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, Label } from "@/components/ui/select";
import { CADENCES, DOW } from "@/lib/schedule";
import { cn } from "@/lib/utils";

type UserOpt = { id: string; name: string };

type Props = {
  users: UserOpt[];
  currentUserId: string;
  chore?: {
    id: string;
    name: string;
    description: string | null;
    assigneeId: string | null;
    cadence: string;
    rotation: boolean;
    scheduledDow: number | null;
    scheduledTime: string | null;
  };
};

export function ChoreForm({ users, currentUserId, chore }: Props) {
  const router = useRouter();
  const [name, setName] = useState(chore?.name ?? "");
  const [assigneeId, setAssigneeId] = useState(chore?.assigneeId ?? currentUserId);
  const [rotation, setRotation] = useState(chore?.rotation ?? false);
  const [cadence, setCadence] = useState(chore?.cadence ?? "weekly");
  const [dow, setDow] = useState(chore?.scheduledDow != null ? String(chore.scheduledDow) : "0");
  const [time, setTime] = useState(chore?.scheduledTime ?? "18:00");
  const [description, setDescription] = useState(chore?.description ?? "");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim() || pending) return;
    const payload = {
      name: name.trim(),
      description,
      assigneeId,
      cadence,
      rotation,
      scheduledDow: cadence === "daily" ? null : Number(dow),
      scheduledTime: time || null,
    };
    startTransition(async () => {
      if (chore) await updateChore({ id: chore.id, ...payload });
      else await createChore(payload);
      router.push("/chores");
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="chore-name">Chore</Label>
        <Input
          id="chore-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Take out the trash"
          autoFocus
        />
      </div>

      <div>
        <Label>Assignment</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: false, label: "One person", hint: "Always the same roommate" },
            { val: true, label: "Rotate", hint: "Hands off each time it's done" },
          ].map((opt) => {
            const on = rotation === opt.val;
            return (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => setRotation(opt.val)}
                aria-pressed={on}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors active:scale-[.99]",
                  on
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border hover:border-primary/40",
                )}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="assignee">{rotation ? "Starts with" : "Who's doing it"}</Label>
        <Select id="assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.id === currentUserId ? " (you)" : ""}
            </option>
          ))}
        </Select>
        {rotation ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Takes turns between roommates — whoever&apos;s up gets the reminders.
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="cadence">How often</Label>
        <Select id="cadence" value={cadence} onChange={(e) => setCadence(e.target.value)}>
          {CADENCES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-3">
        {cadence !== "daily" ? (
          <div className="flex-1">
            <Label htmlFor="dow">Day</Label>
            <Select id="dow" value={dow} onChange={(e) => setDow(e.target.value)}>
              {DOW.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="flex-1">
          <Label htmlFor="time">Reminder time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="chore-notes">Notes (optional)</Label>
        <Textarea
          id="chore-notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything to remember…"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={!name.trim() || pending} className="flex-1">
          <Save /> {chore ? "Save changes" : "Add chore"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
