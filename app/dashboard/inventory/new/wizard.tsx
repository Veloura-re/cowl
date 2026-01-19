'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressStepper from '@/components/ui/progress-stepper'
import { ItemProvider } from '@/context/item-context'
import Step1BasicInfo from './step-1'
import Step2PricingStock from './step-2'
import Step3Review from './step-3'

export default function ItemWizard() {
    const [currentStep, setCurrentStep] = useState(1)
    const router = useRouter()

    const steps = ['Basic Info', 'Pricing & Stock', 'Review']

    const handleNext = () => {
        if (currentStep < 3) {
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
        router.push('/dashboard/inventory')
        router.refresh()
    }

    return (
        <ItemProvider>
            <div className="min-h-screen pb-20 px-4 sm:px-6 animate-in fade-in duration-500">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Progress Stepper */}
                    <div className="glass rounded-2xl border border-white/40 p-4">
                        <ProgressStepper
                            currentStep={currentStep}
                            steps={steps}
                            onStepClick={handleStepClick}
                        />
                    </div>

                    {/* Step Content */}
                    <div className="animate-in slide-in-from-right-5 fade-in duration-300">
                        {currentStep === 1 && (
                            <Step1BasicInfo onNext={handleNext} />
                        )}
                        {currentStep === 2 && (
                            <Step2PricingStock
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3Review
                                onComplete={handleComplete}
                                onBack={handleBack}
                            />
                        )}
                    </div>
                </div>
            </div>
        </ItemProvider>
    )
}
