import React from 'react'
import { useForm } from 'react-hook-form'

export const OverrideReasonModal: React.FC<{ open: boolean; onClose: ()=>void; onSubmit: (payload:any)=>void }> = ({ open, onClose, onSubmit }) => {
  const { register, handleSubmit, formState } = useForm<{reason:string}>({ defaultValues: { reason: '' }})
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-4">
        <h3 className="font-semibold mb-2">Override Reason (required)</h3>
        <form onSubmit={handleSubmit((data)=> onSubmit(data))}>
          <textarea {...register('reason', { required: true, minLength: 10 })} className="w-full p-2 border" rows={6} />
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="px-3 py-1 border rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded" disabled={formState.isSubmitting}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OverrideReasonModal
