import { Alert } from '@/components/common/Alert'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Spinner } from '@/components/common/Spinner'
import { ROUTES } from '@/config/routes'
import { useAuthContext } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/format'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
	const navigate = useNavigate()
	const { login, isLoading, error, clearError } = useAuthContext()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()
		clearError()
		const ok = await login({ email: email.trim(), password })
		if (ok) navigate(ROUTES.dashboard, { replace: true })
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950'>
			<div className='mx-auto flex min-h-screen max-w-[1100px] flex-col items-center justify-center px-4 py-10'>
				<div className='w-full sm:max-w-md'>
					<div className='mb-6'>
						<div className='text-3xl font-semibold text-white'>
							Cloud ERP CRM WMS
						</div>
						<div className='mt-2 text-sm text-white/70'>
							Wholesale operations dashboard for product, orders, and warehouse
							execution.
						</div>
					</div>

					<Card className='p-6'>
          <h1> Ishladi</h1>
						<form onSubmit={onSubmit} className='space-y-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-white/80'>
									Email
								</label>
								<Input
									type='email'
									autoComplete='email'
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder='name@company.com'
									required
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-white/80'>
									Password
								</label>
								<Input
									type='password'
									autoComplete='current-password'
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder='••••••••'
									required
								/>
							</div>

							{error ? (
								<Alert tone='error' title='Sign in failed'>
									{error}
								</Alert>
							) : null}

							<Button
								type='submit'
								disabled={!canSubmit}
								leftIcon={isLoading ? <Spinner size={18} /> : null}
							>
								{isLoading ? 'Signing in…' : 'Login'}
							</Button>
						</form>
					</Card>

					<div className='mt-4 text-xs text-white/50'>
						Tip: Ensure your API URL is set via{' '}
						<span className='font-semibold'>VITE_API_URL</span>.
					</div>
					<div className='mt-1 text-xs text-white/40'>
						Build timestamp: {formatDate(new Date().toISOString())}
					</div>
				</div>
			</div>
		</div>
	)
}
