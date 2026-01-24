'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressStepper from '@/components/ui/progress-stepper'
import { InvoiceProvider } from '@/context/invoice-context'
import Step1PartyInfo from './step-1'
import Step2AddItems from './step-2'
import Step3Review from './step-3'
import Step4Success from './step-4'

type WizardProps = {
    parties: any[]
    items: any[]
}

export default function InvoiceWizard({ parties, items }: WizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const router = useRouter()

    const steps = ['Party Info', 'Add Items', 'Review', 'Complete']

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleStepClick = (step: number) => {
        if (step <= currentStep) {
            setCurrentStep(step)
        }
    }

    const handleComplete = () => {
        router.push('/dashboard/sales')
        router.refresh()
    }

    return (
        <InvoiceProvider>
            <div className="min-h-screen pb-20 px-4 sm:px-6 animate-in fade-in duration-500">
                <div className="max-w-5xl mx-auto space-y-4">
                    {/* Progress Stepper */}
                    <div className="glass rounded-2xl border border-gray-200 p-4">
                        <ProgressStepper
                            currentStep={currentStep}
                            steps={steps}
                            onStepClick={handleStepClick}
                        />
                    </div>

                    {/* Step Content */}
                    <div className="animate-in slide-in-from-right-5 fade-in duration-300">
                        {currentStep === 1 && (
                            <Step1PartyInfo
                                parties={parties}
                                onNext={handleNext}
                            />
                        )}
                        {currentStep === 2 && (
                            <Step2AddItems
                                items={items}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3Review
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {currentStep === 4 && (
                            <Step4Success onComplete={handleComplete} />
                        )}
                    </div>
                </div>
            </div>
        </InvoiceProvider>
    )
}
