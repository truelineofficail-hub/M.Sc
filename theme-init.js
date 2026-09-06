(function(){
    try{
        var saved=localStorage.getItem("theme");
        if(saved==="dark"){
            document.documentElement.setAttribute(
                "data-theme","dark"
            );
        }
    }catch(e){}
})();
