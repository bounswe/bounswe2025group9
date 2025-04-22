import { UserPlus } from '@phosphor-icons/react'

// signup page component (placeholder)
const Signup = () => {
    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="max-w-md mx-auto nh-card">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center mr-2">
                            <UserPlus size={28} weight="bold" className="text-primary flex-shrink-0" />
                        </div>
                        <h2 className="nh-title text-center">Sign Up</h2>
                    </div>
                    <p className="nh-text text-center mb-6">
                        This is a placeholder for the Signup page.
                        Implementation will come in the next phase.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Signup 