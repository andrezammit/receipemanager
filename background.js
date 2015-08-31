chrome.app.runtime.onLaunched.addListener(
	function() 
	{
  		chrome.app.window.create('index.html', 
  		{
    		"bounds": 
    		{
      			"width": 700,
      			"height": 650,
            "left": 100,
            "top": 100
    		}
  		});
});