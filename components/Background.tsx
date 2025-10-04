
import React from 'react';

const Background: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-gray-900 via-indigo-900 to-black">
            <style>
                {`
                @keyframes move-twink-back {
                    from {background-position:0 0;}
                    to {background-position:-10000px 5000px;}
                }
                .stars, .twinkling {
                    position:absolute;
                    top:0;
                    left:0;
                    right:0;
                    bottom:0;
                    width:100%;
                    height:100%;
                    display:block;
                }
                .stars {
                    background:#000 url(https://www.script-tutorials.com/demos/360/images/stars.png) repeat top center;
                    z-index:1;
                }
                .twinkling{
                    background:transparent url(https://www.script-tutorials.com/demos/360/images/twinkling.png) repeat top center;
                    z-index:2;
                    animation:move-twink-back 200s linear infinite;
                }
                `}
            </style>
            <div className="stars opacity-50"></div>
            <div className="twinkling opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent z-30"></div>
        </div>
    );
};

export default Background;
