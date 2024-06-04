import React from 'react';
import "./headerStyles.css";


function Header() {
  return (
    <header class="bg-white">
  <nav class="mx-auto flex w-full shadow-xl items-center justify-between lg:px-8 border-2	" aria-label="Global">
   
    

    <div   className="h-20 w-36 p-0 flex justify-start" style={{
        backgroundImage: "url('/LOGorei.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain", // or "cover" depending on your requirement
    backgroundPosition: "center",
      }}>

        </div>
    <div class="hidden lg:flex lg:flex-1 lg:gap-x-12 justify-end mr-32" >
   
    <a href="#" class="buttonelement">Home</a>
      <a href="#" class="buttonelement">Upload your Resume</a>
      <a href="#" class="buttonelement">Help?</a>
    </div>
  </nav>

  <div class="lg:hidden" role="dialog" aria-modal="true">
  
    <div class="fixed inset-0 z-10"></div>
    <div class="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
      <div class="flex items-center justify-between">
        {/* <a href="#" class="-m-1.5 p-1.5">
          <span class="sr-only">Your Company</span>
          <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="">
        </a> */}
        
      </div>
     
    </div>
  </div>
</header>
  );
}

export default Header;
