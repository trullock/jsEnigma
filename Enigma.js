var KeyIsDown = false;

$(function(){
    
    // Initialise the enigma device
    Enigma.Init();
    
    // Configure draggable rotors
    $('#RotorBin, #Rotors').Sortable({
	    accept: 'rotor',
	    helperclass: 'rotorHolder',
	    revert: true,
	    floats: true,
	    onStop: Enigma.ConfigureRotors,
	    handle: '.idnumber, .gears'
	});

	$('#btnClearInput').click(function(){
	    $('#txtInput').val('');
	});
	
	$('#btnEncrypt').click(function(){
	    var txtOutput = $('#txtOutput');
	    var txtInput = $('#txtInput');
	    
	    txtOutput.val('');
	    
	    var plaintext = txtInput.val();
	    
	    for(var i = 0; i < plaintext.length; i++)
	        txtOutput.val(txtOutput.val() + Enigma.EncodeCharacter(plaintext.charAt(i), false));
	});
	
	$('.rotor .numbers ul').mousedown(function(e){
	     dragging = true;
	     oldY = e.clientY;
	     draggedElem = this;
	});
	$(document).mouseup(function(e){
	    if(dragging)
	    {
	        var elem = $(draggedElem)
	        var csstop = elem.css("top");
	        var top = parseInt(csstop.substring(0, csstop.length - 2));
	        Enigma._activeRotors[elem.parents('#Rotors').find('.rotor').index(elem.parents('.rotor'))].SetPosition((top / -16) - 1);
	        dragging = false;
	    }
	});
	
	$(document).mousemove(function(e){
	     if(dragging)
	     {
	        var dy = e.clientY - oldY;
	        if(Math.abs(dy) >= 4)
	        {
	            var csstop = $(draggedElem).css("top");
	            var top = parseInt(csstop.substring(0, csstop.length - 2));

                var newy;
                if(dy < 0)
                {
                    newy = top - 16;
                    if(newy == -16 * 27)
                        newy = -16;
                }
                else
                {
                    newy = top + 16;
                    if(newy == 16)
                        newy = -16 * 26;
                }	            

	            $(draggedElem).css("top", newy + "px");
	            oldY = e.clientY;
	        }
	     }
	});
   
});

var dragging = false;
var oldY;
var draggedElem;

var Enigma = {

    _allRotors: []
    ,_activeRotors: []
    ,_reflector: undefined
    ,_lid: undefined
 
    ,Init: function()
    {
        // Create three rotors
        this._allRotors.push(new Roter('#Rotor1', 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'));
        this._allRotors.push(new Roter('#Rotor2', 'AJDKSIRUXBLHWTMCQGZNPYFVOE'));
        this._allRotors.push(new Roter('#Rotor3', 'BDFHJLCPRTXVZNYEIWGAKMUSQO'));
        this._allRotors.push(new Roter('#Rotor4', 'ESOVPZJAYQUIRHXLNFTGKDCMWB'));
        
        // All rotors 1, 2 and 3 to the machine
        this._activeRotors.push(this._allRotors[0]);
        this._activeRotors.push(this._allRotors[1]);
        this._activeRotors.push(this._allRotors[2]);
        
        this.ConfigureRotors();
        
        this._lid = $('#Lid');
        
        var self = this;
        
        // Attach keypress handlers
        $('.key').mousedown(function(){
            self.KeyDown($(this).text());
        });
        $('.key').mouseup(function(){
            self.KeyUp($(this).text());
        });
        
        $('#OpenLid').click(function(){
            self.OpenLid();
        });
        $('#CloseLid').click(function(){
            self.CloseLid();
        });
        
        // Configure the reflector
        this._reflector = new Reflector(new Array(25, 18, 21, 8, 17, 19, 12, 4, 16, 24, 14, 7, 15, 11, 13, 9, 5, 2, 6, 26, 3, 23, 22, 10, 1, 20));
    }
    
    ,Reset: function()
    {
        for(var i = 0; i < this._activeRotors.length; i++)
            this._activeRotors[i].Reset();
    }
    
    ,EncodeCharacter: function(char, animate)
    {
        if(animate == undefined)
            animate = true;
    
        // pass the character through the roters
        var i = char.charCodeAt(0) - 65;
        
        // run through the rotors forwards
        var ciphertext = i;
        for(var x = 0; x < this._activeRotors.length; x++)
            ciphertext = this._activeRotors[x].EncodeForwards(ciphertext);
              
        // reflect
        ciphertext = this._reflector.EncodeCharacter(ciphertext);
        
        // run back through the rotors
        for(var x = this._activeRotors.length -1; x >= 0; x--)
            ciphertext = this._activeRotors[x].EncodeBackwards(ciphertext);
        
        // Convert back to a char
        ciphertext = String.fromCharCode(ciphertext + 65);
        
        // Rotate the wheels and perform rotation carry
        for(var x = this._activeRotors.length -1; x >= 0; x--)
        {
            if(this._activeRotors[x].Rotate(animate) != 0)
                break;
        }
        
        return ciphertext;
    }
    
    ,ConfigureRotors: function()
    {
        var self = Enigma;
        var i = 8;
        $('#RotorBin .rotor').each(function(){
            $(this).css("zIndex", i--);
        });
        
        self._activeRotors = [];
        $('#Rotors .rotor').each(function(){
            var me = $(this);
            me.css("zIndex", i--);
            self._activeRotors.push(self._allRotors[parseInt(me.find('.idnumber').text()) - 1]);
        });
    }
    
    ,OpenLid: function()
    {
        this._lid.slideUp(400);
        $('.rotor').addClass('availableRotor');
    }
    
    ,CloseLid: function()
    {
        this._lid.slideDown(400);
        $('.rotor').removeClass('availableRotor');
    }
    
    ,KeyDown: function(letter)
    {
        if(!KeyIsDown)
        {
            KeyIsDown = true;
            $('#Keyboard .key:contains(' + letter + ')').addClass('activeKey');
            
            var cipherText = Enigma.EncodeCharacter(letter);
            
            var PlainTextLog = $('#txtInput');
            PlainTextLog.val(PlainTextLog.val() + letter);
            
            var CipherTextLog = $('#txtOutput');
            CipherTextLog.val(CipherTextLog.val() + cipherText);
            
            $('#BulbPanel .bulb:contains(' + cipherText + ')').addClass('activeBulb');
        }
    }
    
    ,KeyUp: function(letter)
    {
        if(KeyIsDown)
        {
            $('#Keyboard .key:contains(' + letter + ')').removeClass('activeKey');
            $('#BulbPanel .bulb').removeClass('activeBulb');
            KeyIsDown = false;
        }
    }
}

function Reflector(mappings){
    this._mappings = mappings;

    this.EncodeCharacter = function(i)
    {
        return this._mappings[i] - 1;
    }
}

function Roter(selector, mappings)
{
    // Properties
    // ================================
    this._pos = 0;
    this._rotor = $(selector);
    this._gears = this._rotor.find('.gears');
    this._numbers = this._rotor.find('.numbers ul');
    
    // Constructor
    // ================================
    // Create Rotor mapping hash tables
    this._forwardMappings = new Array(mappings.length);
    this._backwardMappings = new Array(mappings.length);
    for(var i = 0; i < mappings.length; i++)
    {
        var c = mappings.charCodeAt(i) - 65;
        this._forwardMappings[i] = c;
        this._backwardMappings[c] = i;
    }

    // Public methods
    // ================================
    
    //
    this.SetPosition = function(i)
    {
        this._pos = i;
    }
    
    // Encodes a character
    this.EncodeForwards = function(i)
    {
        return this._forwardMappings[(i + this._pos) % this._forwardMappings.length];
    }
    
    // Decodes a character
    this.EncodeBackwards = function(i)
    {
        return (this._backwardMappings.length - mod((this._pos - this._backwardMappings[i]), this._backwardMappings.length)) % this._backwardMappings.length;
        
//        for(var x = 0; x < this._forwardMappings.length; x++)
//        {
//            if(this._forwardMappings[(x + this._pos) % this._forwardMappings.length] == i)
//                return x;
//        }
    }
    
    // Rotates the rotor
    this.Rotate = function(animate)
    {
        if(this._pos < 25)
            this._pos++;
        else
            this._pos = 0;
            
        this._animate(animate);

        return this._pos;
    }
    
    // Sets the roto back to zero
    this.Reset = function()
    {
        this._pos = 0;
        this._numbers.css("top", "-16px");
    }
    
    // Animates the rotors rotation
    this._animate = function(animate)
    {
        var self = this;
        
        var y = (this._pos * -16) - 16;
        
        if(animate)
        {
            this._gears.animate({
                top: "-14px"
            }, 200, undefined, function(){
                self._gears.css("top", "0px");
            });
            
            this._numbers.animate({
                top: y + "px"
            }, 200, undefined, function(){
                if(self._pos == 25)
                    self._numbers.css("top", "0px");
            });
        }
        else
        {
            if(self._pos != 25)
                self._numbers.css("top", y + "px");
            else    
                self._numbers.css("top", "0px");
        }
    }
}



function Test()
{
    Enigma.Reset();
    
    var input = '';
    
    for(var x = 0; x < 1000; x++)
        for(var i = 65; i < 90; i++)
        {
            input += String.fromCharCode(i);
        }
    
    var output = ''
    for(var i = 0; i < input.length; i++)
        output = output + Enigma.EncodeCharacter(input.charAt(i), false);
        
    Enigma.Reset();
    
    var deciphered = '';
    for(var i = 0; i < output.length; i++)
        deciphered = deciphered + Enigma.EncodeCharacter(output.charAt(i), false);
        
    alert(deciphered == input);
}

function mod(X, Y) {
    var t;
    t = X % Y;
    return t < 0 ? t + Y : t;
}