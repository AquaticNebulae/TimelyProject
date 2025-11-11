import React from "react";
import Navbar from "./Navbar";

type Props = {
  sidebarToggle: boolean;
setSidebarToggle: (v: boolean) => void;
};

const Dashboard: React.FC < Props > = ({ sidebarToggle, setSidebarToggle }) => {
    return (
  
      <>
  
        < Navbar
        sidebarToggle ={ sidebarToggle}
    setSidebarToggle ={ setSidebarToggle}
      />

      < div className ={`${ sidebarToggle ? "md:ml-16" : "md:ml-64"} mt - 16`}>
        < main className = "p-6" >
          Dashboard content
        </ main >
      </ div >
    </>
  );
}
;

export default Dashboard;



