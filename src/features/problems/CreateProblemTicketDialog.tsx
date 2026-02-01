'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateProblemTicket, useTickets } from '@/services';
import type { CreateProblemTicketForm, ProblemCategory, Ticket, TicketPriority } from '@/types';

interface CreateProblemTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTickets: Ticket[];
  onSuccess: (problemTicket: Ticket, action?: 'create' | 'analyze') => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const problemCategories: ProblemCategory[] = [
  'Configuration',
  'Capacity',
  'Change Management',
  'Known Error',
  'Third Party',
  'Unknown',
];

const priorityOrder: Record<TicketPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
const priorityOptions: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];

const getHighestPriority = (tickets: Ticket[]) => {
  if (tickets.length === 0) return 'Medium';
  return tickets.reduce<TicketPriority>((highest, ticket) => {
    return priorityOrder[ticket.priority] < priorityOrder[highest] ? ticket.priority : highest;
  }, tickets[0].priority);
};

const getMostCommonGroup = (tickets: Ticket[]) => {
  if (tickets.length === 0) return '';
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const group = ticket.assigned_group?.trim();
    if (!group) continue;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  let winner = tickets[0].assigned_group ?? '';
  let best = 0;
  counts.forEach((count, group) => {
    if (count > best) {
      best = count;
      winner = group;
    }
  });
  return winner;
};

const getNextProblemNumberPreview = (tickets: Ticket[]) => {
  const maxNumber = tickets
    .map((ticket) => ticket.number)
    .filter((number) => number.startsWith('PRB'))
    .map((number) => Number(number.replace('PRB', '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);
  return `PRB${String(maxNumber + 1).padStart(6, '0')}`;
};

const buildInitialForm = (tickets: Ticket[]): CreateProblemTicketForm => ({
  short_description: tickets[0]?.short_description ?? '',
  description: '',
  problem_category: 'Unknown',
  priority: getHighestPriority(tickets),
  assigned_group: getMostCommonGroup(tickets),
  affected_ticket_ids: tickets.map((ticket) => ticket.id),
  root_cause_summary: '',
});

export const CreateProblemTicketDialog = ({
  isOpen,
  onClose,
  preselectedTickets,
  onSuccess,
  addToast,
}: CreateProblemTicketDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateProblemTicketForm>(() =>
    buildInitialForm(preselectedTickets)
  );

  const { data: ticketsData } = useTickets({ limit: 2000, page: 1 });
  const createProblemTicket = useCreateProblemTicket();

  useEffect(() => {
    if (!isOpen) return;
    const initialForm = buildInitialForm(preselectedTickets);
    setStep(1);
    setSelectedTicketIds(initialForm.affected_ticket_ids);
    setFormData(initialForm);
  }, [isOpen, preselectedTickets]);

  const allTickets = ticketsData?.tickets ?? preselectedTickets;
  const previewNumber = getNextProblemNumberPreview(allTickets);
  const selectedTickets = preselectedTickets.filter((ticket) =>
    selectedTicketIds.includes(ticket.id)
  );

  const validationErrors = {
    tickets: selectedTicketIds.length < 2 ? 'Select at least 2 tickets.' : '',
    short_description:
      formData.short_description.trim().length < 10 ? 'Short description must be at least 10 characters.' : '',
    description:
      formData.description.trim().length < 20 ? 'Description must be at least 20 characters.' : '',
    assigned_group: formData.assigned_group.trim().length === 0 ? 'Assigned group is required.' : '',
  };
  const isStep1Valid = Object.values(validationErrors).every((error) => !error);

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const next = prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId];
      setFormData((current) => ({ ...current, affected_ticket_ids: next }));
      return next;
    });
  };

  const handleCreate = async (action: 'create' | 'analyze') => {
    try {
      const created = await createProblemTicket.mutateAsync({
        ...formData,
        affected_ticket_ids: selectedTicketIds,
      });
      onSuccess(created, action);
      onClose();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to create problem ticket', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-slate-950">
        <div className="max-h-[90vh] overflow-y-auto p-6 space-y-6">
          <DialogHeader>
            <DialogTitle>Create Problem Ticket</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Step {step} of 2 — {step === 1 ? 'Tickets & Details' : 'Review & Confirm'}</span>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <span className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Affected Tickets</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedTicketIds.length} of {preselectedTickets.length} included
                  </span>
                </div>
                <div className="space-y-2">
                  {preselectedTickets.map((ticket) => (
                    <label
                      key={ticket.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedTicketIds.includes(ticket.id)}
                        onCheckedChange={() => handleToggleTicket(ticket.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {ticket.number}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-white truncate">
                          {ticket.short_description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {validationErrors.tickets && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.tickets}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short Description</label>
                  <Input
                    value={formData.short_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, short_description: e.target.value }))}
                  />
                  {validationErrors.short_description && (
                    <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.short_description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[96px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Problem Category</label>
                    <select
                      value={formData.problem_category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          problem_category: e.target.value as ProblemCategory,
                        }))
                      }
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      {problemCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as TicketPriority,
                        }))
                      }
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Group</label>
                  <Input
                    value={formData.assigned_group}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assigned_group: e.target.value }))}
                  />
                  {validationErrors.assigned_group && (
                    <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.assigned_group}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Root Cause Summary (optional)
                  </label>
                  <textarea
                    value={formData.root_cause_summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, root_cause_summary: e.target.value }))}
                    className="w-full min-h-[72px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)} disabled={!isStep1Valid}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Problem Preview</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{previewNumber}</h3>
                    </div>
                    <Badge variant="outline">{formData.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formData.short_description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formData.problem_category}</p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Linked Incidents: {selectedTicketIds.length}
                  </div>
                  <div className="space-y-1">
                    {selectedTickets.map((ticket) => (
                      <div key={ticket.id} className="text-xs text-slate-600 dark:text-slate-300">
                        • {ticket.number} — {ticket.short_description}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCreate('create')}
                    disabled={createProblemTicket.isPending}
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => handleCreate('analyze')}
                    disabled={createProblemTicket.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create & Analyze
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
