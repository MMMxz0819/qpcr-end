# coding:utf-8
# SIR模型预测


import scipy.integrate as spi
import numpy as np
import matplotlib.pyplot as pl
import pandas as pd
import sys

beta = float(sys.argv[1])     #感染系数
gamma = float(sys.argv[2])    #治愈系数
delta = 5e-6	#新增的死亡系数
TS = 1
ND = 50.0  
S0 = float(sys.argv[3])  #易感染人数
I0 = float(sys.argv[4])   #感染人数

# beta = 24e-5     #感染系数
# gamma = 0.12    #治愈系数
# S0 = 2000  #易感染人数
# I0 = 32  #感染人数

M0 = 0   #最开始的死亡人数
INPUT = [S0, I0, 0.0, M0]

# 模型的差分方程
def diff_eqs(INP, t):
	Y = np.zeros((4))
	V = INP
	Y[0] = -beta * V[0] * V[1]
	Y[1] = beta * V[0] * V[1] - gamma * V[1]-delta * V[1]
	Y[2] = gamma * V[1]
	Y[3] = delta * V[1]
	return Y

if __name__ == "__main__":	
	t_start = 0.0
	t_end = ND
	t_inc = TS
	t_range = np.arange(t_start, t_end+t_inc, t_inc)
	RES = spi.odeint(diff_eqs, INPUT, t_range)
	print(np.array(RES))
	# fig = pl.figure(1)
	# pl.subplot(111)
	# pl.plot(RES[:, 1], "-r", label = "Infectious")
	# pl.plot(RES[:, 0], "-g", label = "Susceptibles")
	# pl.plot(RES[:, 2], "-k", label = "Recovereds")
	# pl.plot(RES[:, 3], "-b", label = "Death")
	# pl.legend(loc = 0)
	# pl.title("SIR model")
	# pl.xlabel("Time")
	# pl.ylabel("Infectious Susceptibles")
	# pl.savefig("D:/kejian/bs/qpcr-front/src/assets/model.png")

	# # # 读取数据
	# data = pd.read_csv("D:/kejian/bs/qpcr-end/data.csv", index_col = 'date')
		
	# # print("MaxInfection:%d position:%d" % (RES[:,1].max(), np.argmax(RES[:, 1])))
	# # 将预测值与真实值画到一起
	# fig = pl.figure(2)
	# pl.subplot(111)

	# if(data["现有感染者"].max()<10):{
	# 	pl.ylim(0, 100)
	# }
	# if(data["现有感染者"].max()<100):{
	# 	pl.ylim(0, 500)
	# }
	# pl.plot(RES[:, 1], "-r", label = "Infectious")
	# pl.plot(data["现有感染者"], "o", label = "realdata")
	# pl.legend(loc = 0)
	# pl.title("Real and Trend")
	# pl.xlabel("Time")
	# pl.ylabel("Infectious Susceptibles")
	# pl.savefig("D:/kejian/bs/qpcr-front/src/assets/result.png")

	


	
#################################################################################	
	#  计算β值，用确诊病例除以密切接触者人数
	# gammaguess = (data["治愈"]+data["死亡"])/data["感染者"]
	# print(gammaguess)
	# gamma = gammaguess[-7:-1].mean()
	# print(gamma)
	# beta = gamma*2.0
	# print(beta)
	# fig = pl.figure()
	# pl.plot(gammaguess)
	# pl.savefig("gama.png")
	# pl.show()

	#  #γ值设定为0.04，即一般病程25天
	#  #用最小二乘法估计β值和初始易感人数
	# gamma = 0.04
	# S0 = [i for i in range(20000, 40000, 1000)]
	# beta = [f for f in np.arange(1e-7, 1e-4, 1e-7)]
	
	# # 定义偏差函数
	# def error(res):
	# 	err = (data["感染者"].iloc[:21] - res)**2
	# 	errsum = sum(err)
	# 	return errsum
		
	#  #穷举法，找出与实际数据差的平方和最小的S0和beta值
	# # 结果 S0 = 39000, β = 8e-6
	# minSum = 1e10
	# minS0 = 0.0
	# minBeta = 0.0
	# bestRes = None
	# for S in S0:
	# 	for b in beta:
	# 		# 模型的差分方程
	# 		def diff_eqs_2(INP, t):
	# 			Y = np.zeros((3))
	# 			V = INP
	# 			Y[0] = -b * V[0] * V[1]
	# 			Y[1] = b * V[0] * V[1] - gamma * V[1]
	# 			Y[2] = gamma * V[1]
	# 			return Y
	# 		# 数值解模型方程
	# 		INPUT = [S, I0, 0.0]
	# 		RES = spi.odeint(diff_eqs_2, INPUT, t_range)
	# 		errsum = error(RES[:21, 1])
	# 		if errsum < minSum:
	# 			minSum = errsum
	# 			minS0 = S
	# 			minBeta = b
	# 			bestRes = RES
	# 			print("S0=%d beta=%f minErr=%f" % (S, b, errsum))
				
	# print("S0 = %d β = %f" % (minS0, minBeta))