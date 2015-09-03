chrome.app.runtime.onLaunched.addListener(
	function() 
	{
  		chrome.app.window.create('index.html', 
  		{
    		"bounds": 
    		{
      			"width": 1100,
      			"height": 700,
            "left": 100,
            "top": 100
    		}
  		});
});