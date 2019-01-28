//draw3d sphere on top of tappered cylinder

var canvas,gl,program;

var projectionMatrix;
var projectionMatrixLoc;
var modelviewMatrixLeft;
var modelviewMatrixRight;
var modelviewMatrix;
var modelviewMatrixLoc;
var tmatrix = mat4(); //holds tranformations
var tvert = 0; //holds vertical translations
var thori = 0; //hold translation horizontal

var eye= [25,0,25];
var at = [0, 0, 0];
var up = [0, 1, 0];
var spinAngle = Math.PI/40; //automation step
var now; 
var lasttime;

//breath timer
var breathNow;
var breathLastTime;

//===================================
//BEGIN           breath variables
//==================================

var TLC = 5000 // TOTAL LUNG CAPACITY mL

//============== SITTING ================ DEFAULT

var SIRV = 600 // SITTING RESIDUAL VOLUME mL
var SITV = 600 // SITTING TIDAL VOLUME mL
var SIRR = 12 // SITTING RESPIRATORY RATE breaths/minute
var SIMV = SITV*SIRR // SITTING MINUTE VENTILATION mL/minute
var IEN = TLC - (SIRV+SITV) // TO CALCULATE IRV AND ERV
var SIIRV = IEN*.52 //SITTING INSPIRATORY RESERVE VOLUME mL
var SIERV = IEN*.48 //SITTING EXPIRATORY RESERVE VOLUME mL
console.log(IEN)
//============== SLEEPING ================

var SLRV = 450 // SLEEPING RESIDUAL VOLUME mL
var SLTV = 450 // SLEEPING TIDAL VOLUME mL
var SLRR = 8 // SLEEPING RESPIRATORY RATE breaths/minute
var SLMV = SLTV*SLRR // SLEEPING MINUTE VENTILATION mL/minute
IEN = TLC - (SLRV+SLTV) // TO CALCULATE IRV AND ERV
var SLIRV = IEN*.52 //SLEEPING INSPIRATORY RESERVE VOLUME mL
var SLERV = IEN*.48 //SLEEPING EXPIRATORY RESERVE VOLUME mL

//============== CURRENT ================

var CRV = SIRV // CURRENT RESIDUAL VOLUME mL
var CTV = SITV // CURRENT TIDAL VOLUME mL
var CRR = SIRR // CURRENT RESPIRATORY RATE breaths/minute
var CMV = CTV*CRR // CURRENT MINUTE VENTILATION mL/minute
IEN = TLC - (CRV+CTV) // TO CALCULATE IRV AND ERV
var CIRV = IEN*.52 //CURRENT INSPIRATORY RESERVE VOLUME mL
var CERV = IEN*.48 //CURRENT EXPIRATORY RESERVE VOLUME mL

//===================================
//END             breath variables
//==================================

// # of stacks and slices
var sphereStacks = 30;
var sphereSlices = 30;

//radius of sphere
var sphereRadius = 13.4;
//target radius for breath (between 0.5 and 1.5 times sphereRadius)
var targetRadius = 13.4;

//currentStep
var currentRadiusStep = 0;
//breath part 0 = inhale or 1 = exhale
var breathPart = 0;
//plane curve points for sphere
var spherePoints = [];
// sphere polar
var spherePolar = [];
//First sphere
//vertices
var sphereVerticesLeft = [];
//Second sphere
//vertices
var sphereVerticesRight = [];



//# of steps for circle thats lung back
var circleStep = 360;
// circleStep made special during testing for sphere
var sphereCircleStep = 360;

//===================================
//BEGIN           breathing variables
//==================================

var minRadius = (SIRV + SIERV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
var maxRadius = 2*3*(SIRV + SIERV + SITV)/(4*Math.PI*sphereRadius*sphereRadius);
//stepsize of radius for lung
var stepRadius = (maxRadius-minRadius)/(((60000/SIRR)/50)/2);



//===================================
//END             breathing variables
//==================================



//airway1st part
// an airway stack 
//      _| |_       1st stack
//     |_   _|      2nd stack
//      _| |_
//     |_   _|
//      _| |_
//     |_   _|
//      _| |_
//     |_   _|
//       | |
//
//
var airStacks =5; //the number of 1st and second stacks
var airSlices = 30;

var airLength = 38;
var airBase = 9.5;
var airInnerRadius = 3;
var airInnerHeight = 2.5;
var airOuterRadius = 4;
var airOuterHeight = 4.5;
var airRadius = [airInnerRadius,airOuterRadius];


var airPoints = [];
var airPolar = [];
var airInnerVertices = [];
var airOuterVertices = [];

var airOuterBottomVertices = [];
var airOuterTopVertices = [];





//points to draw
var points = [];
//colors holds diffuse and and specular for light and material (set in quad)
var colors = [];
var normalsArray = [];

//special vectors to draw for breathing (b)
var bpoints = [];
var bcolors = [];
var bnormals = [];

//all variables of ortho for zoom
var orthoV;

//Set MODE	
var mode = "s"; //for stop animation

// light and material
var lightPosition = vec4(eye, 0 );

//var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var ambientProduct = vec4(.9*.9, .9*.9, .9*.9, 1.0); // light ambient and material ambient is unchanging
// light Diffuse and specular are the same AND
// material diffuse and specular are the same SO
// they are multiplied and held in the colors array
//var lightDiffuse = vec4(.8, 0.8, 0.8, 1.0 );
//var lightSpecular = vec4( .8, .8, .8, 1.0 );
var materialShininess=10;


window.onload = function init() 
{
	orthoV = 60;
	date = new Date();
	now = Date.now();
	lasttime = Date.now();
	
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.clearColor( 1.0,1.0,1.0, 1.0 );
	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);   // do not show back face 
    //gl.cullFace(gl.FRONT); 
    //gl.disable(gl.CULL_FACE);
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	Interface();
	document.getElementById("LungVolume").value = (4/3)*Math.PI*sphereRadius*sphereRadius*targetRadius/2;
	setBaseVarDisplay(SIRV,SITV,SIRR,SIMV,SIIRV,SIERV);
	setCurrentVarDisplay(SIRV,SITV,SIRR,SIMV,SIIRV,SIERV);
	//Genereatesphere
	//generateSphereStacks();
	
	//generate First Sphere
	generateLeftSphereVertices();
	
	//generate Second Sphere
	generateRightSphereVertices();
	
	generateLungBacks();
	//console.log(points)
	//Generate vertical airway
	
	var base = airBase;
	for (var i = 0; i < airStacks; i += 1)
	{
		base = airBase + i*(airInnerHeight + airOuterHeight);
		console.log(base)
		generateAirVertices(base);
	}
	
	
	initModelView();
	
	render();
	
}
//==============================================
//
//   HANDLE keyboard clicks
//
//==============================================
window.onkeydown = function(event) 
{
	var x = event.which || event.keyCode;
	
	if (x == 109 || x == 77) //MOVE
	{
		mode = "m";
	}else if (x== 82 || x == 114) //ROTATE
	{
		mode = "r";
	}else if (x == 65 || x == 97)  //ANIMATE
	{
		mode = "a";
		now = Date.now();
		lasttime = Date.now();
		breathPart = 0;
		currentRadiusStep = 0;
		breathLastTime = Date.now();
		
	}else if (x == 83 || x == 115) //STOP
	{
		mode = "s";
	}else if (x == 37) //left
	{
		if (mode == "m")
		{
			thori = thori - 2*sphereRadius*0.02;
			tmatrix = translate(thori,tvert,0);
			//modelviewMatrix = mult(modelviewMatrix,tmatrix);
		}else if (mode == "r")
		{
	
			eye[0] = eye[0]*Math.cos(-(5/180)*Math.PI) + eye[2]*Math.sin(-(5/180)*Math.PI);
			eye[2] = -eye[0]*Math.sin(-(5/180)*Math.PI) + eye[2]*Math.cos(-(5/180)*Math.PI);
		}
		
	}else if (x == 38) //up
	{
		if (mode == "m")
		{
			tvert = tvert + 2*sphereRadius*0.02;
			tmatrix = translate(thori,tvert,0);
			//modelviewMatrix = mult(modelviewMatrix,tmatrix);
		}else if (mode == "r")
		{
			eye[1] = eye[1]*Math.cos((5/180)*Math.PI) - eye[2]*Math.sin((5/180)*Math.PI);
			eye[2] = eye[1]*Math.sin((5/180)*Math.PI) + eye[2]*Math.cos((5/180)*Math.PI);
		}
		
	}else if (x == 39) // right
	{
		if (mode == "m")
		{
			thori = thori + 2*sphereRadius*0.02;
			tmatrix = translate(thori,tvert,0);
		}else if (mode == "r")
		{
			eye[0] = eye[0]*Math.cos((5/180)*Math.PI) + eye[2]*Math.sin((5/180)*Math.PI);
			eye[2] = -eye[0]*Math.sin((5/180)*Math.PI) + eye[2]*Math.cos((5/180)*Math.PI);
		}
		
	}else if (x == 40) //down
	{
		if (mode == "m")
		{
			tvert = tvert - 2*sphereRadius*0.02;
			tmatrix = translate(thori,tvert,0);
		}else if (mode == "r")
		{
			eye[1] = eye[1]*Math.cos(-(5/180)*Math.PI) - eye[2]*Math.sin(-(5/180)*Math.PI);
			eye[2] = eye[1]*Math.sin(-(5/180)*Math.PI) + eye[2]*Math.cos(-(5/180)*Math.PI);
		}
		
	}else if (x == 70 || x == 102) //f ZOOM IN
	{
		orthoV = orthoV*.98;
		
	}else if (x == 66 || x == 98) //b ZOOM OUT
	{
		orthoV = orthoV*1.2;
	}
	 	
	
	//modelviewMatrix = mult(modelviewMatrix,lookAt(eye, at, up));
	
	/* modelviewMatrixLeft = mat4();//translate(-1.5*sphereRadius,0,0) ;
	modelviewMatrixLeft = mult(modelviewMatrixLeft,tmatrix);
    modelviewMatrixLeft = mult(modelviewMatrixLeft,lookAt(eye, at, up));
	
	modelviewMatrixRight = mat4();//translate(1.5*sphereRadius,0,0) ;
	modelviewMatrixRight = mult(modelviewMatrixRight,tmatrix);
    modelviewMatrixRight = mult(modelviewMatrixRight,lookAt(eye, at, up)); */
	
	modelviewMatrix = mat4(); //rotate(spinAngle,u);
	//modelviewMatrixRight = mult(modelviewMatrixRight,translate(1.5*sphereRadius,0,0) );
	modelviewMatrix = mult(modelviewMatrix,tmatrix);
	modelviewMatrix = mult(modelviewMatrix,lookAt(eye, at, up));
	
}

//===============================
//
// HANDLE BUTTONS
//
//===================================
var nextPosition = "Sleeping";

function Interface()
{
	document.getElementById("changePos").onclick = function () {
		document.getElementById("position").value = nextPosition;
		if (nextPosition == "Sitting")
		{
			minRadius = (SIRV + SIERV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(SIRV + SIERV + SITV)/(4*Math.PI*sphereRadius*sphereRadius);
			//stepsize of radius for lung
			stepRadius = (maxRadius-minRadius)/(((60000/SIRR)/50)/2);
			setBaseVarDisplay(SIRV,SITV,SIRR,SIMV,SIIRV,SIERV);
			nextPosition = "Sleeping";
		}else
		{
			minRadius = (SLRV + SLERV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(SLRV + SLERV + SLTV)/(4*Math.PI*sphereRadius*sphereRadius);
			//stepsize of radius for lung
			stepRadius = (maxRadius-minRadius)/(((60000/SLRR)/50)/2);
			setBaseVarDisplay(SLRV,SLTV,SLRR,SLMV,SLIRV,SLERV);
			nextPosition = "Sitting";
			
		}
		mode = "a";
		now = Date.now();
		lasttime = Date.now();
		breathPart = 0;
		currentRadiusStep = 0;
		breathLastTime = Date.now();
	};
	
	document.getElementById("vitalCapacity").onclick = function () {
		if (nextPosition == "Sitting")
		{
			minRadius = (SLRV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(TLC)/(4*Math.PI*sphereRadius*sphereRadius);
			stepRadius = (maxRadius-minRadius)/(((60000/30)/50)/2);
		}else
		{
			minRadius = (SIRV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(TLC)/(4*Math.PI*sphereRadius*sphereRadius);
			stepRadius = (maxRadius-minRadius)/(((60000/30)/50)/2);
		}
		mode = "a";
		now = Date.now();
		lasttime = Date.now();
		breathPart = 0;
		currentRadiusStep = 0;
		breathLastTime = Date.now();
	}
	
	document.getElementById("percentFlow").onclick = function () {
		var percent = document.getElementById("percent").value;
		if (isNaN(percent) || percent == "" || percent < 0 || percent > 99.99)
		{
			alert("Percent must be between 0 and 99.99.");
			
				
		}else
		{
			
			if (nextPosition == "Sleeping")
			{
				CRV = SIRV;
				CMV = (1-0.01*percent)*SIMV;
				CTV = SITV;
				CRR = CMV/CTV;
				IEN = TLC - (CRV+CTV);
				CIRV = IEN*.52;
				CERV = IEN*.48;
			}else
			{
				CRV = SLRV;
				CMV = (1-0.01*percent)*SLMV;
				CTV = SLTV;
				CRR = CMV/CTV;
				IEN = TLC - (CRV+CTV);
				CIRV = IEN*.52;
				CERV = IEN*.48;
			}
			
			minRadius = (CRV + CERV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(CRV + CERV + CTV)/(4*Math.PI*sphereRadius*sphereRadius);
			//stepsize of radius for lung
			stepRadius = (maxRadius-minRadius)/(((60000/CRR)/50)/2);
			setCurrentVarDisplay(CRV,CTV,CRR,CMV,CIRV,CERV);
			mode = "a";
			now = Date.now();
			lasttime = Date.now();
			breathPart = 0;
			currentRadiusStep = 0;
			breathLastTime = Date.now();
		}
	}
	
	document.getElementById("reduceVolume").onclick = function () {
		var percent = document.getElementById("percent").value;
		var rRate = document.getElementById("CRR").value;
		pCheck = isNaN(percent) || percent == "" || percent < 0 || percent > 99.99;
		rCheck = isNaN(rRate) || rRate == "" || rRate < 5 || rRate > 30;
		if (pCheck || rCheck)
		{
			alert("Percent must be between 0 and 99.99 and Repiratory Rate must be between 5 and 30.");
			
				
		}else
		{
			
			if (nextPosition == "Sleeping")
			{
				CRV = SIRV;
				CMV = (1-0.01*percent)*SIMV;
				CRR = rRate;
				CTV = CMV/CRR;				
				IEN = TLC - (CRV+CTV);
				CIRV = IEN*.52;
				CERV = IEN*.48;
			}else
			{
				CRV = SLRV;
				CMV = (1-0.01*percent)*SLMV;
				CRR = rRate;
				CTV = CMV/CRR;				
				IEN = TLC - (CRV+CTV);
				CIRV = IEN*.52;
				CERV = IEN*.48;
			}
			
			minRadius = (CRV + CERV)*2*(3/(4*Math.PI*sphereRadius*sphereRadius));
			maxRadius = 2*3*(CRV + CERV + CTV)/(4*Math.PI*sphereRadius*sphereRadius);
			//stepsize of radius for lung
			stepRadius = (maxRadius-minRadius)/(((60000/CRR)/50)/2);
			setCurrentVarDisplay(CRV,CTV,CRR,CMV,CIRV,CERV);
			mode = "a";
			now = Date.now();
			lasttime = Date.now();
			breathPart = 0;
			currentRadiusStep = 0;
			breathLastTime = Date.now();
		}
	}
}

function setBaseVarDisplay(RV,TV,RR,MV,IRV,ERV)
{
	document.getElementById("BRV").value = RV;
	document.getElementById("BTV").value = TV;
	document.getElementById("BRR").value = RR;
	document.getElementById("BMV").value = MV;
	document.getElementById("BIRV").value = IRV;
	document.getElementById("BERV").value = ERV;
}

function setCurrentVarDisplay(RV,TV,RR,MV,IRV,ERV)
{
	document.getElementById("CRV").value = RV;
	document.getElementById("CTV").value = TV;
	document.getElementById("CRR").value = RR;
	document.getElementById("CMV").value = MV;
	document.getElementById("CIRV").value = IRV;
	document.getElementById("CERV").value = ERV;
}




//==============================================
//
//                   INITIALIZE FUNCTIONS
//
//===========================================
//function to create buffers and assign locations to them

//
//==============================================

function initModelView()
{
	projectionMatrixLoc= gl.getUniformLocation(program, "projectionMatrix");
    modelviewMatrixLoc= gl.getUniformLocation(program, "modelviewMatrix");
	modelviewMatrix = mat4(); //rotate(spinAngle,u);
	modelviewMatrix = mult(modelviewMatrix,lookAt(eye, at, up));
}

function initBuffers()
{
	// color array atrribute buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	// normal array attribute buffer
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
	
    // vertex array attribute buffer
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );	
	

}

function initChangeBuffers()
{
	// color array atrribute buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(bcolors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	// normal array attribute buffer
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(bnormals), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
	
    // vertex array attribute buffer
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(bpoints), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );	
	

}


function initLightingMaterial()
{

	// send lighting and material coefficient products to GPU
    gl.uniform4fv( gl.getUniformLocation(program, "ambient"),flatten(ambientProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
}

//==============================================
//
//  ADD BREATHING LUNGS TO THEIR OWN LIST TO BE DRAWN
//
//==============================================


//create plane curve for sphere
function generateSphereStacks()
{
	spherePoints = [];
	//
	//number of steps to smooth radius (stepCount)
	var stepCount = Math.floor(sphereStacks/4);
	//step size for smoothing
	var stepSize = 1/stepCount;
	//top smoothing total step size
	var ts = 0;
	//bottom smoothing total step size;
	var bs = 1;
	//radius in current use
	var currentRadius;
	
	for (var count = 0; count <= sphereStacks; count += 1)
	{
		angle = Math.PI/2 - (count*Math.PI)/sphereStacks;
		//decide sphere radius
		if (count <= stepCount)
		{
			currentRadius = sphereRadius + ts*(targetRadius-sphereRadius);
			ts = ts + stepSize;
		}else if (sphereStacks - count <= stepCount)
		{
			currentRadius = sphereRadius + bs*(targetRadius-sphereRadius);
			bs = bs - stepSize;
		}
		
		spherePoints.push([currentRadius*Math.cos(angle), currentRadius*Math.sin(angle),0]);
		
	}
	//console.log(spherePoints.length);
}	

//create slices of sphere
function generateLeftSphereVertices()
{
	sphereVerticesLeft = [];
	spherePolar = [];
	
	for (var count = 0; count <= sphereSlices; count += 1)
	{
		angle =-Math.PI/2 + (count*Math.PI)/(sphereSlices);	
		for (var i = 0; i <= sphereStacks; i += 1)
		{
			angle2 = (i/sphereStacks)*(Math.PI);			
			sphereVerticesLeft.push(vec4(-targetRadius*Math.cos(angle)*Math.sin(angle2)-sphereRadius,sphereRadius*Math.sin(angle)*Math.sin(angle2),sphereRadius*Math.cos(angle2),1.0));
			spherePolar.push([angle2,angle]);
		}
	}
	addSphere(sphereVerticesLeft, spherePolar, sphereSlices, sphereStacks, bpoints,bnormals,bcolors);
	
}
function generateRightSphereVertices()
{
	sphereVerticesRight = [];
	spherePolar = [];
	/*
	//copy plane curve
	for (var i = 0; i <= sphereStacks; i += 1)
	{
		angle2 = Math.PI/2 - count*(Math.PI/2)/(sphereStacks);
		angle = -Math.PI/2;
		sphereVerticesRight.push(vec4(spherePoints[i][0]*Math.cos(angle)+sphereRadius,spherePoints[i][1],spherePoints[i][0]*(-Math.sin(angle)),1.0));
		//sphereVerticesRight.push(vec4(spherePoints[i][0]+1.5*sphereRadius,spherePoints[i][1],spherePoints[i][2],1.0));
		spherePolar.push([angle2,0]);
	}
	//duplicate plane curve at incremented angle
	for (var count = 1; count <= sphereSlices; count += 1)
	{
		angle = -Math.PI/2+(count/sphereSlices)*Math.PI;	
		for (var i = 0; i <= sphereStacks; i += 1)
		{
			angle2 = Math.PI/2 - i*(Math.PI/2)/(sphereStacks);			
			sphereVerticesRight.push(vec4(spherePoints[i][0]*Math.cos(angle)+sphereRadius,spherePoints[i][1],spherePoints[i][0]*(-Math.sin(angle)),1.0));
			spherePolar.push([angle2,angle]);
		}
	}
	*/
	for (var count = 0; count <= sphereSlices; count += 1)
	{
		angle =-Math.PI/2 + (count*Math.PI)/(sphereSlices);	
		for (var i = 0; i <= sphereStacks; i += 1)
		{
			angle2 = (i/sphereStacks)*(Math.PI);			
			sphereVerticesRight.push(vec4(targetRadius*Math.cos(angle)*Math.sin(angle2)+sphereRadius,sphereRadius*Math.sin(angle)*Math.sin(angle2),sphereRadius*Math.cos(angle2),1.0));
			spherePolar.push([angle2,angle]);
		}
	}
	addSphere(sphereVerticesRight, spherePolar, sphereSlices, sphereStacks, bpoints,bnormals,bcolors);
}

//==============================================
//
//  ADD THE BACK OF LUNGS TO LIST TO BE DRAWN
//
//==============================================

function generateLungBacks()
{
	points.push(vec4(-sphereRadius,0,0,1.0));
	temp = vec4(0,0,0,1.0);
	ntemp = vec3(1,0,0);
	colors.push(temp);
	normalsArray.push(ntemp);
	for (var i = 0; i<= circleStep; i = i + 1)
	{
		angle = 2*Math.PI - i*2*Math.PI/circleStep
		
		points.push(vec4(-sphereRadius, sphereRadius*Math.sin(angle),sphereRadius*Math.cos(angle),1.0));
		colors.push(temp);
		normalsArray.push(ntemp);
	}
	points.push(vec4(sphereRadius,0,0,1.0));
	colors.push(temp);
	ntemp = vec3(-1,0,0);
	normalsArray.push(ntemp);
	for (var i = 0; i<= circleStep; i = i + 1)
	{
		angle = i*2*Math.PI/circleStep
		points.push(vec4(sphereRadius, sphereRadius*Math.sin(angle),sphereRadius*Math.cos(angle),1.0));
		colors.push(temp);
		normalsArray.push(ntemp);
	}
}

//==============================================
//
//  ADD AIRWAYS TO LIST TO BE DRAWN
//
//==============================================

//create plane curve for airway
function generateAirStacks()
{
	airPoints.push([airInnerRadius, airBase,0]);
	var l;
	for (var count = 1; count <= airStacks; count += 1)
	{
		l = airBase +count*airLength/airStacks;
		airPoints.push([airRadius[count%2],l,0]);
		airPoints.push([airRadius[(count+1)%2],l,0]);
		
	}
}	

//create slices of sphere
function generateAirVertices(base)
{
	
	airInnerVertices = [];
	airOuterVertices = [];

	airOuterBottomVertices = [];
	airOuterTopVertices = [];
	
	for (var count = 0; count <= airSlices; count += 1)
	{
		angle = (count*2*Math.PI)/(airSlices-1);
		//inner cylinder
		airInnerVertices.push(vec4(airInnerRadius*Math.cos(angle),base, airInnerRadius*Math.sin(angle), 1.0));
		airInnerVertices.push(vec4(airInnerRadius*Math.cos(angle),base + airInnerHeight, airInnerRadius*Math.sin(angle), 1.0));
		
		//outerCylinder Bottom
		airOuterBottomVertices.push(vec4(airOuterRadius*Math.cos(angle),base + airInnerHeight, airOuterRadius*Math.sin(angle),1.0));
		airOuterBottomVertices.push(vec4(airInnerRadius*Math.cos(angle),base + airInnerHeight, airInnerRadius*Math.sin(angle), 1.0));
		
		//outerCylinder
		airOuterVertices.push(vec4(airOuterRadius*Math.cos(angle),base + airInnerHeight, airOuterRadius*Math.sin(angle), 1.0));
		airOuterVertices.push(vec4(airOuterRadius*Math.cos(angle),base + airInnerHeight + airOuterHeight, airOuterRadius*Math.sin(angle), 1.0));
		
		//outerCylinder Top
		airOuterTopVertices.push(vec4(airInnerRadius*Math.cos(angle),base + airInnerHeight + airOuterHeight, airInnerRadius*Math.sin(angle),1.0));
		airOuterTopVertices.push(vec4(airOuterRadius*Math.cos(angle),base + airInnerHeight + airOuterHeight, airOuterRadius*Math.sin(angle), 1.0));
		
		
		
		airPolar.push([1,angle]);
		airPolar.push([1,angle*1.5]);
	}
	
	addSphere(airInnerVertices, airPolar, airSlices, 1, points,normalsArray,colors);
	addSphere(airOuterBottomVertices, airPolar, airSlices, 1, points,normalsArray,colors);
	addSphere(airOuterVertices, airPolar, airSlices, 1, points,normalsArray,colors);
	addSphere(airOuterTopVertices, airPolar, airSlices, 1, points,normalsArray,colors); //*/
	
}

//==============================================
//
//  RENDER AND ANIMATE
//
//==============================================

function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    projectionMatrix = ortho(-orthoV, orthoV, -orthoV, orthoV, -80, 80);
	
	if (mode == "a")
	{
		now = Date.now();
		
		elapsed = now - lasttime;
		if (elapsed > 50)
		{
			/*
			//MAKE SURE YOU ARE RADIUS 2 AWAY FOR ROTATION
			var div = Math.sqrt(Math.pow(eye[0],2) + Math.pow(eye[1],2) + Math.pow(eye[2],2));
			eye[0] = 2*eye[0]/div;
			eye[1] = 2*eye[1]/div;
			eye[2] = 2*eye[2]/div;
			eye[0] = eye[0]*Math.cos(spinAngle) + eye[2]*Math.sin(spinAngle);
			eye[2] = -eye[0]*Math.sin(spinAngle) + eye[2]*Math.cos(spinAngle);
						
			modelviewMatrix = mat4(); //rotate(spinAngle,u);
			//modelviewMatrixRight = mult(modelviewMatrixRight,translate(1.5*sphereRadius,0,0) );
			modelviewMatrix = mult(modelviewMatrix,tmatrix);
			modelviewMatrix = mult(modelviewMatrix,lookAt(eye, at, up));
			*/
			
			targetRadius = minRadius + currentRadiusStep*stepRadius;
			if (breathPart == 0)
			{
				currentRadiusStep = currentRadiusStep + 1;
				if ((minRadius + currentRadiusStep*stepRadius) > maxRadius)
				{
					breathPart = 1;
					currentRadiusStep = currentRadiusStep - 1;
				}
			}else
			{
				currentRadiusStep = currentRadiusStep - 1;
				if ((minRadius + currentRadiusStep*stepRadius) < minRadius)
				{
					breathPart = 0;
					breathNow = Date.now();
					console.log(breathNow-breathLastTime);
					breathLastTime = breathNow;
					currentRadiusStep = currentRadiusStep + 1;
				}
			}
			document.getElementById("LungVolume").value = (4/3)*Math.PI*sphereRadius*sphereRadius*targetRadius/2;
			//console.log()
			bpoints = [];
			bcolors = [];
			bnormals = [];
			//generate First Sphere
			generateLeftSphereVertices();
			
			//generate Second Sphere
			generateRightSphereVertices();
			lasttime = now;
		}
	}
	lightPosition = vec4(eye, 0 );
	
	//**************************************
	//
	//               DRAW BREATHING LUNGS
	//
	//*******************************************
	
	gl.uniformMatrix4fv(modelviewMatrixLoc, false, flatten(modelviewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    //gl.uniformMatrix4fv(modelviewMatrixLoc, false, flatten(modelviewMatrixLeft) );
    //gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	gl.clearColor( 1.0,1.0,1.0, 1.0 );
	
	initChangeBuffers();
	initLightingMaterial();
	gl.drawArrays(gl.TRIANGLES, 0, sphereSlices*sphereStacks*6);
	
	//gl.uniformMatrix4fv(modelviewMatrixLoc, false, flatten(modelviewMatrixRight) );
    //gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	
	gl.drawArrays(gl.TRIANGLES, sphereSlices*sphereStacks*6, sphereSlices*sphereStacks*6);
	
	
	//**************************************
	//
	//               DRAW AIRWAY
	//
	//*******************************************
	
	/* modelviewMatrix = mat4();
	modelviewMatrix = mult(modelviewMatrix,tmatrix);
	modelviewMatrix = mult(modelviewMatrix,lookAt(eye, at, up));
	gl.uniformMatrix4fv(modelviewMatrixLoc, false, flatten(modelviewMatrix) ); */
	//console.log(points[sphereSlices*sphereStacks*6*2])
	initBuffers();
	//initLightingMaterial();
	gl.drawArrays(gl.TRIANGLE_FAN,0,circleStep+2);
	gl.drawArrays(gl.TRIANGLE_FAN,circleStep+2,circleStep+2);
	lungBackCount = (circleStep+2)*2;
	
	gl.drawArrays(gl.TRIANGLES, lungBackCount, airSlices*6);
	gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6, airSlices*6);
	gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*2, airSlices*6);
	gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*3, airSlices*6);
	
	for (var i = 1; i < airStacks; i += 1)
	{
		//console.log(points[0 + airSlices*6*4*i])
		gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*4*i, airSlices*6);
		gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*4*i+ airSlices*6, airSlices*6);
		gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*4*i + airSlices*6*2, airSlices*6);
		gl.drawArrays(gl.TRIANGLES, lungBackCount + airSlices*6*4*i + airSlices*6*3, airSlices*6);
	}
	
	
	requestAnimFrame(render);
}


//**************************************
//
//               SUPPORT FUNCTIONS
//
//*******************************************
function addSphere(sphere, polar, Slices, Stacks,addPointsTo, addNormalsTo, addColorsTo)
{
	var N=Stacks+1; 
	// quad strips are formed slice by slice
	for (var i=0; i<(Slices); i++) // slices
	{
		for (var j=0; j<Stacks; j++)  // stacks
		{
			quad(i*N+j, (i+1)*N+j, (i+1)*N+(j+1), i*N+(j+1), sphere, polar, addPointsTo, addNormalsTo, addColorsTo);  
		}
	}  
}


function quad(a, b, c, d, sphereVertices, Polar, mypoints, mynormals, mycolors) 
{
     // triangle a-b-c
	 var rColor = 255/255; //1
	 var gColor = 0.25;
	 var bColor = 0.8;
	 var tpoints=[sphereVertices[a], sphereVertices[b], sphereVertices[c], sphereVertices[d]];
   	 var normal = Newell(tpoints);
	 
     mypoints.push(sphereVertices[a]); 
	 mycolors.push(vec4(Math.sin(Polar[a][0]*Polar[a][1]) * rColor * 0.8, Math.sin(Polar[a][0]*Polar[a][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);

     mypoints.push(sphereVertices[b]);
	 mycolors.push(vec4(Math.sin(Polar[b][0]*Polar[b][1]) * rColor * 0.8, Math.sin(Polar[b][0]*Polar[b][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);
	 
     mypoints.push(sphereVertices[c]); 
	 mycolors.push(vec4(Math.sin(Polar[c][0]*Polar[c][1]) * rColor * 0.8, Math.sin(Polar[c][0]*Polar[c][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);

     // triangle a-c-d
     mypoints.push(sphereVertices[a]); 
	 mycolors.push(vec4(Math.sin(Polar[a][0]*Polar[a][1]) * rColor * 0.8, Math.sin(Polar[a][0]*Polar[a][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);

     mypoints.push(sphereVertices[c]);
	 mycolors.push(vec4(Math.sin(Polar[c][0]*Polar[b][1]) * rColor * 0.8, Math.sin(Polar[c][0]*Polar[b][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);

     mypoints.push(sphereVertices[d]); 
	 mycolors.push(vec4(Math.sin(Polar[d][0]*Polar[c][1]) * rColor * 0.8, Math.sin(Polar[d][0]*Polar[c][1])* gColor * 0.8, bColor * 0.8, 1.0));
	 mynormals.push(normal);
	 
	 
}

function Newell(vertices)
{
   var L=vertices.length;
   var x=0, y=0, z=0;
   var index, nextIndex;

   for (var i=0; i<L; i++)
   {
       index=i;
       nextIndex = (i+1)%L;
       
       x += (vertices[index][1] - vertices[nextIndex][1])*
            (vertices[index][2] + vertices[nextIndex][2]);
       y += (vertices[index][2] - vertices[nextIndex][2])*
            (vertices[index][0] + vertices[nextIndex][0]);
       z += (vertices[index][0] - vertices[nextIndex][0])*
            (vertices[index][1] + vertices[nextIndex][1]);
   }

   return (normalize(vec3(x, y, z)));
}
