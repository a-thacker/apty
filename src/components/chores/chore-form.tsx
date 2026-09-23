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
    scheduledDow: number | null;
    scheduledTime: string | null;
  };
};

export function ChoreForm({ users, currentUserId, chore }: Props) {
  const router = useRouter();
  const [name, setName] = useState(chore?.name ?? "");
  const [assigneeId, setAssigneeId] = useState(chore?.assigneeId ?? currentUserId);
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
        <Label htmlFor="assignee">Who&apos;s doing it</Label>
        <Select id="assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.id === currentUserId ? " (you)" : ""}
            </option>
          ))}
        </Select>
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
