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
                            <h4 className="text-lg font-medium mb-2 text-white text-center md:text-left">Connect</h4>
                            <ul className="space-y-2 flex flex-col items-center md:items-start">
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
                                <li>
                                    <a href="https://github.com/bounswe/bounswe2025group9/releases/latest/download/nutrihub.apk" // Placeholder for APK link
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="nh-text-light hover:text-white flex items-center">
                                        <div className="flex items-center justify-center mr-1">
                                            {/* Android APK icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18" height="18" viewBox="0 0 50 50" fill="currentColor">
                                                <path d="M 16.28125 0.03125 C 16.152344 0.0546875 16.019531 0.078125 15.90625 0.15625 C 15.449219 0.464844 15.347656 1.105469 15.65625 1.5625 L 17.8125 4.78125 C 14.480469 6.546875 11.996094 9.480469 11.1875 13 L 38.8125 13 C 38.003906 9.480469 35.519531 6.546875 32.1875 4.78125 L 34.34375 1.5625 C 34.652344 1.105469 34.550781 0.464844 34.09375 0.15625 C 33.632813 -0.152344 32.996094 -0.0195313 32.6875 0.4375 L 30.3125 3.9375 C 28.664063 3.335938 26.875 3 25 3 C 23.125 3 21.335938 3.335938 19.6875 3.9375 L 17.3125 0.4375 C 17.082031 0.09375 16.664063 -0.0429688 16.28125 0.03125 Z M 19.5 8 C 20.328125 8 21 8.671875 21 9.5 C 21 10.332031 20.328125 11 19.5 11 C 18.667969 11 18 10.332031 18 9.5 C 18 8.671875 18.667969 8 19.5 8 Z M 30.5 8 C 31.332031 8 32 8.671875 32 9.5 C 32 10.332031 31.332031 11 30.5 11 C 29.671875 11 29 10.332031 29 9.5 C 29 8.671875 29.671875 8 30.5 8 Z M 8 15 C 6.34375 15 5 16.34375 5 18 L 5 32 C 5 33.65625 6.34375 35 8 35 C 8.351563 35 8.6875 34.925781 9 34.8125 L 9 15.1875 C 8.6875 15.074219 8.351563 15 8 15 Z M 11 15 L 11 37 C 11 38.652344 12.347656 40 14 40 L 36 40 C 37.652344 40 39 38.652344 39 37 L 39 15 Z M 42 15 C 41.648438 15 41.3125 15.074219 41 15.1875 L 41 34.8125 C 41.3125 34.921875 41.648438 35 42 35 C 43.65625 35 45 33.65625 45 32 L 45 18 C 45 16.34375 43.65625 15 42 15 Z M 15 42 L 15 46 C 15 48.207031 16.792969 50 19 50 C 21.207031 50 23 48.207031 23 46 L 23 42 Z M 27 42 L 27 46 C 27 48.207031 28.792969 50 31 50 C 33.207031 50 35 48.207031 35 46 L 35 42 Z"></path>
                                            </svg>
                                        </div>
                                        Android Apk
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-6 pt-6 text-center nh-text-light">
                    <span className="flex items-center justify-center">
                        <div className="flex items-center justify-center mr-1">
                            <Copyright size={16} className="flex-shrink-0" />
                        </div>
                        {new Date().getFullYear()} NutriHub. BOUN SWE 2025 Group 9
                    </span>
                </div>
            </div>
        </footer>
    )
}

export default Footer 