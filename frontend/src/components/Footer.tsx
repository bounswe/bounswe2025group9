import { GithubLogo, Copyright } from '@phosphor-icons/react'

// footer component
const Footer = () => {
    return (
        <footer className="nh-footer">
            <div className="nh-container">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-semibold mb-2 text-white">NutriHub</h3>
                        <p className="nh-text-light flex items-center">

                            Your journey to healthier eating starts here
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row md:space-x-8">
                        <div>
                            <h4 className="text-lg font-medium mb-2 text-white">Connect</h4>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://github.com/bounswe/bounswe2025group9"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="nh-text-light hover:text-white flex items-center">
                                        <div className="flex items-center justify-center mr-1">
                                            <GithubLogo size={18} className="flex-shrink-0" />
                                        </div>
                                        GitHub
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-6 pt-6 text-center nh-text-light">
                    <p className="flex items-center justify-center">
                        <div className="flex items-center justify-center mr-1">
                            <Copyright size={16} className="flex-shrink-0" />
                        </div>
                        {new Date().getFullYear()} NutriHub. BOUN SWE 2025 Group 9
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer 