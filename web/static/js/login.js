$(document).ready(async function(req, res){
    $('#loginBtn').click(async function(){
        $.ajax({
            url:`/loginCheck`,
            dataType:'text',
            type:'POST',
            data: {"username":$('#loginId').val(),
                "password":$('#loginPw').val()},
            error: function(){
                alert("에러가 발생했습니다");
            },
            success:function(data){ //function안에 data라고 넣어서 처리 
                const obj = JSON.parse(data);
                const msg = document.getElementById("errormsg");
                if(obj.status == 200){
                    window.location.reload();
                }else if(obj.status ==201){
                    msg.innerText = "비밀번호가 일치하지 않습니다";
                }else{
                    msg.innerText = "아이디가 일치하지 않습니다";
                }
            }
        });
    })
})
    

