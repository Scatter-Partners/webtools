var random_images_array = [
"Kitty-Kaki-Blink.gif", 
"Kitty-Kaki-Heart-Eyes.gif", 
"Kitty-Kaki-Meow.gif",
"Kitty-Kaki-Smug3.gif",
"devukittysmol.gif",
"gun.gif",
"hamterdumpy.gif",
"hamterpat.gif",
"wory.png",
"woow.png",
"frie.png",
"funy.png",
"hapy.png",
"no_fumo.png",
"jimmy.png",
];

path = 'images/mascots/'; 
var num = Math.floor( Math.random() * random_images_array.length );
var img = random_images_array[ num ];
var imgStr = '<img src="' + path + img + '" alt="hi!">';


document.write(imgStr); document.close();
