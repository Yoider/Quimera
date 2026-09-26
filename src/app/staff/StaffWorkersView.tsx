'use client';

import React, { useState, useTransition } from 'react';
import { Worker, StaffRole, ShiftPreference, PREFERENCE_LABELS } from '@/lib/schedule/types';
import { updateWorkerAction, createWorkerAction, deleteWorkerAction } from '@/lib/schedule/actions';
import {
  Users,
  UserPlus,
  Clock,
  Briefcase,
  Sliders,
  CheckCircle2,
  XCircle,
  X,
  Edit2,
  Sparkles,
  Shield,
  ChefHat,
  Utensils,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface StaffWorkersViewProps {
  initialWorkers: Worker[];
  onWorkerUpdated?: () => void;
  onWorkersChange?: (workers: Worker[]) => void;
}

const ROLE_CONFIG: Record<StaffRole, { label: string; icon: React.ElementType; color: string }> = {
  GERENTE: { label: 'Gerente', icon: Shield, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  ADMIN: { label: 'Administrador', icon: Shield, color: 'bg-red-100 text-red-900 border-red-300' },
  CAMARERO: { label: 'Camarero / Sala', icon: Utensils, color: 'bg-blue-100 text-blue-900 border-blue-300' },
  COCINA: { label: 'Cocina / Fuegos', icon: ChefHat, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
};

export default function StaffWorkersView({
  initialWorkers,
  onWorkerUpdated,
  onWorkersChange,
}: StaffWorkersViewProps) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync when initialWorkers changes
  React.useEffect(() => {
    setWorkers(initialWorkers);
  }, [initialWorkers]);

  // New worker form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('CAMARERO');
  const [newHours, setNewHours] = useState(40);
  const [newPref, setNewPref] = useState<ShiftPreference>('FULL');
  const [newColor, setNewColor] = useState('#2563EB');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveWorkerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    startTransition(async () => {
      const res = await updateWorkerAction(editingWorker.id, {
        name: editingWorker.name,
        role: editingWorker.role,
        contractHours: editingWorker.contractHours,
        preference: editingWorker.preference,
        colorTag: editingWorker.colorTag,
        isActive: editingWorker.isActive,
      });

      if (res.success && res.worker) {
        const updated = res.worker;
        const newWorkers = workers.map((w) => (w.id === updated.id ? updated : w));
        setWorkers(newWorkers);
        if (onWorkersChange) onWorkersChange(newWorkers);
        setEditingWorker(null);
        showToast(`Trabajador "${updated.name}" actualizado correctamente.`);
        if (onWorkerUpdated) onWorkerUpdated();
      }
    });
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await createWorkerAction({
        name: newName,
        username: newUsername,
        role: newRole,
        contractHours: Number(newHours),
        preference: newPref,
        colorTag: newColor,
      });

      if (res.success && res.worker) {
        const newWorkers = [...workers, res.worker!];
        setWorkers(newWorkers);
        if (onWorkersChange) onWorkersChange(newWorkers);
        setIsNewModalOpen(false);
        setNewName('');
        setNewUsername('');
        showToast(`Nuevo trabajador "${res.worker.name}" creado con éxito.`);
        if (onWorkerUpdated) onWorkerUpdated();
      } else {
        alert(res.error || 'Error al crear trabajador');
      }
    });
  };

  const handleDeleteWorker = (workerId: string) => {
    startTransition(async () => {
      const res = await deleteWorkerAction(workerId);
      if (res.success) {
        const deletedWorker = workers.find((w) => w.id === workerId);
        const newWorkers = workers.filter((w) => w.id !== workerId);
        setWorkers(newWorkers);
        if (onWorkersChange) onWorkersChange(newWorkers);
        setWorkerToDelete(null);
        if (editingWorker?.id === workerId) setEditingWorker(null);
        showToast(`Trabajador "${deletedWorker?.name || ''}" eliminado correctamente.`);
        if (onWorkerUpdated) onWorkerUpdated();
      } else {
        alert(res.error || 'Error al eliminar trabajador');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9E2A2B]" />
            <h3 className="font-serif font-bold text-xl text-[#2B2523]">
              Plantilla de la Taberna
            </h3>
          </div>
          <p className="text-xs text-[#6E6259] mt-0.5">
            Configuración de roles, horas de contrato semanal y preferencias de disponibilidad para los cuadrantes.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Añadir Empleado</span>
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workers.map((worker) => {
          const roleConfig = ROLE_CONFIG[worker.role] || ROLE_CONFIG.CAMARERO;
          const RoleIcon = roleConfig.icon;
          const pref = PREFERENCE_LABELS[worker.preference] || PREFERENCE_LABELS.FULL;

          return (
            <div
              key={worker.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between gap-4 ${
                worker.isActive
                  ? 'border-[#EADBC8] hover:border-[#D4A373]'
                  : 'border-stone-200 opacity-60 bg-stone-50'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name & Role */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-serif font-bold text-base shadow-xs"
                      style={{ backgroundColor: worker.colorTag || '#9E2A2B' }}
                    >
                      {worker.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2B2523] leading-snug">
                        {worker.name}
                      </h4>
                      <span className="text-[11px] text-[#6E6259] block">
                        @{worker.username}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleConfig.color}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleConfig.label}</span>
                  </span>
                </div>

                {/* Contract & Preferences Box */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EADBC8]/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6259] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#9E2A2B]" />
                      Contrato semanal:
                    </span>
                    <strong className="text-[#2B2523] font-bold">
                      {worker.contractHours} horas
                    </strong>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#EADBC8]/50">
                    <span className="text-[#6E6259] flex items-center gap-1 shrink-0">
                      <Sliders className="w-3.5 h-3.5 text-[#D4A373]" />
                      Preferencia:
                    </span>
                    <span
                      className="text-[11px] font-semibold text-[#9E2A2B] text-right truncate"
                      title={pref.desc}
                    >
                      {pref.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-[#EADBC8]/60 flex items-center justify-between">
                <span className="text-[11px] text-[#6E6259] flex items-center gap-1">
                  {worker.isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-stone-400" />
                      <span>Inactivo</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingWorker(worker)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#EADBC8] hover:border-[#9E2A2B] text-[#9E2A2B] hover:bg-[#9E2A2B]/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Configurar</span>
                  </button>

                  <button
                    onClick={() => setWorkerToDelete(worker)}
                    className="inline-flex items-center justify-center p-1.5 rounded-lg border border-stone-200 hover:border-rose-400 text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                    title={`Eliminar a ${worker.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Worker Modal */}
      {editingWorker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingWorker(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#EADBC8] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                Editar Trabajador: {editingWorker.name}
              </h3>
              <button
                onClick={() => setEditingWorker(null)}
                className="p-1 rounded-lg text-[#6E6259] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkerEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingWorker.name}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                    Rol en la Taberna
                  </label>
                  <select
                    value={editingWorker.role}
                    onChange={(e) =>
                      setEditingWorker({
                        ...editingWorker,
                        role: e.target.value as StaffRole,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs font-semibold"
                  >
                    <option value="CAMARERO">Camarero / Sala</option>
                    <option value="COCINA">Cocina / Fuegos</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                    Horas de Contrato (Semana)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    step={1}
                    required
                    value={editingWorker.contractHours}
                    onChange={(e) =>
                      setEditingWorker({
                        ...editingWorker,
                        contractHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm font-bold text-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                  Preferencia de Horario
                </label>
                <select
                  value={editingWorker.preference}
                  onChange={(e) =>
                    setEditingWorker({
                      ...editingWorker,
                      preference: e.target.value as ShiftPreference,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs font-semibold"
                >
                  <option value="FULL">Disponibilidad Completa (Cualquier día/turno)</option>
                  <option value="WEEKEND_ONLY">Solo Fines de Semana (Viernes noche, Sábado, Domingo)</option>
                  <option value="WEEKDAY_ONLY">Solo Entre Semana (Martes a Viernes)</option>
                  <option value="MORNING_ONLY">Solo Turnos de Mediodía (12:00 a 16:00)</option>
                  <option value="NIGHT_ONLY">Solo Turnos de Noche (20:00 a 00:00)</option>
                </select>
                <p className="text-[11px] text-[#6E6259] mt-1">
                  La Inteligencia Artificial respetará estrictamente esta preferencia al generar los cuadrantes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                    Color del Cuadrante
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingWorker.colorTag || '#9E2A2B'}
                      onChange={(e) =>
                        setEditingWorker({ ...editingWorker, colorTag: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg border border-[#EADBC8] cursor-pointer"
                    />
                    <span className="text-xs text-[#6E6259]">
                      {editingWorker.colorTag || '#9E2A2B'}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingWorker.isActive}
                      onChange={(e) =>
                        setEditingWorker({
                          ...editingWorker,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#9E2A2B] accent-[#9E2A2B]"
                    />
                    <span className="font-bold text-[#2B2523]">Trabajador Activo</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingWorker;
                    setEditingWorker(null);
                    setWorkerToDelete(toDel);
                  }}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar trabajador</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWorker(null)}
                    className="px-4 py-2 rounded-xl border border-[#EADBC8] text-[#6E6259] font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white font-bold transition-colors cursor-pointer"
                  >
                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Worker Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#EADBC8] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                Dar de Alta Nuevo Empleado
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-[#6E6259] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Sánchez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  required
                  placeholder="roberto_sala"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                    Rol
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs font-semibold"
                  >
                    <option value="CAMARERO">Camarero / Sala</option>
                    <option value="COCINA">Cocina / Fuegos</option>
                    <option value="GERENTE">Gerente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                    Horas de Contrato
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    step={1}
                    required
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm font-bold text-[#9E2A2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                  Preferencia de Horario
                </label>
                <select
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value as ShiftPreference)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs font-semibold"
                >
                  <option value="FULL">Disponibilidad Completa</option>
                  <option value="WEEKEND_ONLY">Solo Fin de Semana (Viernes noche a Domingo)</option>
                  <option value="WEEKDAY_ONLY">Solo Entre Semana (Martes a Viernes)</option>
                  <option value="MORNING_ONLY">Solo Mediodías</option>
                  <option value="NIGHT_ONLY">Solo Noches</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBC8] text-[#6E6259] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white font-bold transition-colors cursor-pointer"
                >
                  {isPending ? 'Creando...' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {workerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isPending && setWorkerToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                  ¿Eliminar trabajador?
                </h3>
                <p className="text-xs text-[#6E6259] leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente a{' '}
                  <strong className="text-[#2B2523]">{workerToDelete.name}</strong> (@{workerToDelete.username})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-[11px] text-rose-800 space-y-1">
              <p>⚠️ <strong>Atención:</strong> Esta acción no se puede deshacer.</p>
              <p>Se eliminarán automáticamente su ficha de empleado y todos sus turnos asignados en los cuadrantes de horarios semanales.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setWorkerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteWorker(workerToDelete.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Eliminando...' : 'Sí, eliminar trabajador'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
